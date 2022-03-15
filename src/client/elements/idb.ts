import { Mutator, Observer, Propagator } from '../helpers'
import { isArray, isStruct } from '../../common'
import type { IDBPDatabase } from 'idb/with-async-ittr'
import type { ScolaTransactionElement } from './transaction'
import type { Struct } from '../../common'
import { Transaction } from '../helpers/transaction'
import { openDB } from 'idb/with-async-ittr'

declare global {
  interface HTMLElementEventMap {
    'sc-idb-add': CustomEvent
    'sc-idb-add-all': CustomEvent
    'sc-idb-clear': CustomEvent
    'sc-idb-delete': CustomEvent
    'sc-idb-delete-all': CustomEvent
    'sc-idb-get': CustomEvent
    'sc-idb-get-all': CustomEvent
    'sc-idb-put': CustomEvent
    'sc-idb-put-all': CustomEvent
    'sc-idb-tadd': CustomEvent
    'sc-idb-tcommit': CustomEvent
    'sc-idb-tdelete': CustomEvent
    'sc-idb-tput': CustomEvent
    'sc-idb-trollback': CustomEvent
  }
}

type Migration = (database: IDBPDatabase) => Promise<void>

export class ScolaIdbElement extends HTMLObjectElement implements ScolaTransactionElement {
  public static migrations: Struct<Migration | undefined> = {}

  public database?: IDBPDatabase

  public key: string

  public mutator: Mutator

  public name: string

  public observer: Observer

  public propagator: Propagator

  public version: number

  public get nameVersion (): string {
    return `${this.name}-${this.version}`
  }

  protected handleAddAllBound = this.handleAddAll.bind(this)

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleDeleteAllBound = this.handleDeleteAll.bind(this)

  protected handleDeleteBound = this.handleDelete.bind(this)

  protected handleErrorBound = this.handleError.bind(this)

  protected handleGetAllBound = this.handleGetAll.bind(this)

  protected handleGetBound = this.handleGet.bind(this)

  protected handlePutAllBound = this.handlePutAll.bind(this)

  protected handlePutBound = this.handlePut.bind(this)

  protected handleTAddBound = this.handleTAdd.bind(this)

  protected handleTCommitBound = this.handleTCommit.bind(this)

  protected handleTDeleteBound = this.handleTDelete.bind(this)

  protected handleTPutBound = this.handleTPut.bind(this)

  protected handleTRollbackBound = this.handleTRollback.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-idb', ScolaIdbElement, {
      extends: 'object'
    })
  }

  public static defineMigrations (migrations: Struct<Migration>): void {
    Object
      .entries(migrations)
      .forEach(([key, migration]) => {
        ScolaIdbElement.migrations[key] = migration
      })
  }

  public async add (data: Struct): Promise<Struct> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.add(this.nameVersion, data)
      })
      .then((key) => {
        if (isStruct(data)) {
          data[this.key] = key
        }
      })
      .then(() => {
        this.update()
        return data
      })
  }

  public async addAll (data: unknown[]): Promise<unknown[]> {
    const database = await this.getDatabase()

    await Promise.all(data.map(async (datum) => {
      if (isStruct(datum)) {
        await database
          .add(this.nameVersion, datum)
          .then((key) => {
            datum[this.key] = key
          })
      }
    }))

    this.update()
    return data
  }

  public async clear (): Promise<void> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.clear(this.nameVersion)
      })
      .then(() => {
        this.update()
      })
  }

  public async commit (transaction: Transaction): Promise<void> {
    if (isStruct(transaction.result)) {
      switch (transaction.type) {
        case 'tadd':
          await this.delete(transaction.data)
          await this.put(transaction.result)
          break
        case 'tdelete':
          await this.delete(transaction.result)
          break
        case 'tput':
          await this.put(transaction.result)
          break
        default:
          break
      }
    }

    await transaction.delete()
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public async delete (data: Struct): Promise<Struct> {
    return this
      .getDatabase()
      .then(async (database) => {
        const key = data[this.key]

        if (
          typeof key === 'number' ||
          typeof key === 'string'
        ) {
          await database.delete(this.nameVersion, key)
        }
      })
      .then(() => {
        this.update()
        return data
      })
  }

  public async deleteAll (data: unknown[]): Promise<unknown[]> {
    const database = await this.getDatabase()

    await Promise.all(data.map(async (datum) => {
      if (isStruct(datum)) {
        const key = datum[this.key]

        if (
          typeof key === 'number' ||
          typeof key === 'string'
        ) {
          await database.delete(this.nameVersion, key)
        }
      }
    }))

    this.update()
    return data
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
    this.close()
  }

  public async get (data: Struct): Promise<Struct | undefined> {
    return this
      .getDatabase()
      .then(async (database) => {
        const key = data[this.key]

        if (
          typeof key === 'number' ||
          typeof key === 'string'
        ) {
          return await database.get(this.nameVersion, key) as unknown as Struct
        }

        return undefined
      })
  }

  public async getAll (): Promise<unknown[]> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.getAll(this.nameVersion)
      })
  }

  public getData (): Struct {
    return {}
  }

  public async put (data: Struct): Promise<Struct> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.put(this.nameVersion, data)
      })
      .then(() => {
        this.update()
        return data
      })
  }

  public async putAll (data: unknown[]): Promise<unknown[]> {
    const database = await this.getDatabase()

    await Promise.all(data.map(async (datum) => {
      if (isStruct(datum)) {
        await database.put(this.nameVersion, datum)
      }
    }))

    this.update()
    return data
  }

  public reset (): void {
    this.key = this.getAttribute('sc-key') ?? 'id'
    this.name = this.getAttribute('sc-name') ?? 'idb'
    this.version = Number(this.getAttribute('sc-version') ?? 1)
  }

  public async rollback (transaction: Transaction): Promise<void> {
    switch (transaction.type) {
      case 'tadd':
        await this.delete(transaction.data)
        break
      case 'tdelete':
        await this.put(transaction.data)
        break
      case 'tput':
        await this.put(transaction.data)
        break
      default:
        break
    }

    await transaction.delete()
  }

  public setData (): void {}

  public toObject (): Struct {
    return {}
  }

  public update (): void {
    this.updateAttributes()
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.setAttribute('sc-updated', Date.now().toString())
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-idb-add', this.handleAddBound)
    this.addEventListener('sc-idb-add-all', this.handleAddAllBound)
    this.addEventListener('sc-idb-clear', this.handleClearBound)
    this.addEventListener('sc-idb-delete', this.handleDeleteBound)
    this.addEventListener('sc-idb-delete-all', this.handleDeleteAllBound)
    this.addEventListener('sc-idb-get', this.handleGetBound)
    this.addEventListener('sc-idb-get-all', this.handleGetAllBound)
    this.addEventListener('sc-idb-put', this.handlePutBound)
    this.addEventListener('sc-idb-put-all', this.handlePutAllBound)
    this.addEventListener('sc-idb-tadd', this.handleTAddBound)
    this.addEventListener('sc-idb-tcommit', this.handleTCommitBound)
    this.addEventListener('sc-idb-tdelete', this.handleTDeleteBound)
    this.addEventListener('sc-idb-tput', this.handleTPutBound)
    this.addEventListener('sc-idb-trollback', this.handleTRollbackBound)
  }

  protected close (): void {
    if (this.database !== undefined) {
      this.database.close()
      this.database.onerror = null
      this.database = undefined
    }
  }

  protected async getDatabase (): Promise<IDBPDatabase> {
    if (this.database !== undefined) {
      return this.database
    }

    return this.open()
  }

  protected handleAdd (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this
        .add(event.detail)
        .then((data) => {
          this.propagator.dispatch('add', [data], event)
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleAddAll (event: CustomEvent): void {
    if (isArray(event.detail)) {
      this
        .addAll(event.detail)
        .then((data) => {
          this.propagator.dispatch('addall', [data], event)
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleClear (): void {
    this
      .clear()
      .then(() => {
        this.propagator.dispatch('clear')
      })
      .catch((error) => {
        this.handleError(error)
      })
  }

  protected handleDelete (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this
        .delete(event.detail)
        .then(() => {
          this.propagator.dispatch('delete', [event.detail], event)
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleDeleteAll (event: CustomEvent): void {
    if (isArray(event.detail)) {
      this
        .deleteAll(event.detail)
        .then(() => {
          this.propagator.dispatch('deleteall', [event.detail], event)
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch('error', [{
      code: 'err_idb',
      message: this.propagator.extractMessage(error)
    }])
  }

  protected handleGet (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this
        .get(event.detail)
        .then((data) => {
          if (data === undefined) {
            this.propagator.dispatch('request', [event.detail], event)
          } else {
            this.propagator.dispatch('get', [data], event)
          }
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleGetAll (event: CustomEvent): void {
    this
      .getAll()
      .then((data) => {
        this.propagator.dispatch('getall', [data], event)
      })
      .catch((error) => {
        this.handleError(error)
      })
  }

  protected handlePut (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this
        .put(event.detail)
        .then(() => {
          this.propagator.dispatch('put', [event.detail], event)
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handlePutAll (event: CustomEvent): void {
    if (isArray(event.detail)) {
      this
        .putAll(event.detail)
        .then(() => {
          this.propagator.dispatch('putall', [event.detail], event)
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleTAdd (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this
        .add(event.detail)
        .then(async (data) => {
          const transaction = new Transaction(this, {
            data: data,
            type: 'tadd'
          })

          await transaction.put()
          this.propagator.dispatch('tadd', [transaction], event)
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleTCommit (event: CustomEvent): void {
    if (event.detail instanceof Transaction) {
      this
        .commit(event.detail)
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleTDelete (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this
        .get(event.detail)
        .then(async (data) => {
          if (
            data !== undefined &&
            isStruct(event.detail)
          ) {
            await this
              .delete(data)
              .then(async () => {
                const transaction = new Transaction(this, {
                  data: data,
                  type: 'tdelete'
                })

                await transaction.put()
                this.propagator.dispatch('tdelete', [transaction], event)
              })
          }
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleTPut (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this
        .get(event.detail)
        .then(async (data) => {
          if (
            data !== undefined &&
            isStruct(event.detail)
          ) {
            await this
              .put(event.detail)
              .then(async () => {
                const transaction = new Transaction(this, {
                  data: data,
                  type: 'tput'
                })

                await transaction.put()
                this.propagator.dispatch('tput', [transaction], event)
              })
          }
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleTRollback (event: CustomEvent): void {
    if (event.detail instanceof Transaction) {
      this
        .rollback(event.detail)
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected async open (): Promise<IDBPDatabase> {
    let migration: Migration | null = null

    this.database = await openDB(this.name, this.version, {
      upgrade: (database, oldVersion, newVersion) => {
        migration = ScolaIdbElement.migrations[`${this.name}_${oldVersion}_${newVersion ?? 0}`] ?? null

        database.createObjectStore(this.nameVersion, {
          autoIncrement: true,
          keyPath: this.key
        })
      }
    })

    try {
      await (migration as Migration | null)?.(this.database)
    } catch (error: unknown) {
      this.handleError(error)
    }

    this.database.onerror = this.handleErrorBound
    return this.database
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-idb-add', this.handleAddBound)
    this.removeEventListener('sc-idb-add-all', this.handleAddBound)
    this.removeEventListener('sc-idb-clear', this.handleClearBound)
    this.removeEventListener('sc-idb-delete', this.handleDeleteBound)
    this.removeEventListener('sc-idb-delete-all', this.handleDeleteAllBound)
    this.removeEventListener('sc-idb-get', this.handleGetBound)
    this.removeEventListener('sc-idb-get-all', this.handleGetAllBound)
    this.removeEventListener('sc-idb-put', this.handlePutBound)
    this.removeEventListener('sc-idb-put-all', this.handlePutAllBound)
    this.removeEventListener('sc-idb-tadd', this.handleTAddBound)
    this.removeEventListener('sc-idb-tcommit', this.handleTCommitBound)
    this.removeEventListener('sc-idb-tdelete', this.handleTDeleteBound)
    this.removeEventListener('sc-idb-tput', this.handleTPutBound)
    this.removeEventListener('sc-idb-trollback', this.handleTRollbackBound)
  }
}
