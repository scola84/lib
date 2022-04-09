import { I18n, cast, isArray, isFile, isNumber, isQuery, isSame, isStruct, isTransaction, toString } from '../../common'
import { Mutator, Observer, Propagator } from '../helpers'
import type { Query, Struct, Transaction } from '../../common'
import type { IDBPDatabase } from 'idb/with-async-ittr'
import type { ScolaElement } from './element'
import { openDB } from 'idb/with-async-ittr'
import { saveAs } from 'file-saver'

declare global {
  interface HTMLElementEventMap {
    'sc-idb-add': CustomEvent
    'sc-idb-add-all': CustomEvent
    'sc-idb-clear': CustomEvent
    'sc-idb-delete': CustomEvent
    'sc-idb-delete-all': CustomEvent
    'sc-idb-download': CustomEvent
    'sc-idb-get': CustomEvent
    'sc-idb-get-all': CustomEvent
    'sc-idb-put': CustomEvent
    'sc-idb-put-all': CustomEvent
    'sc-idb-tadd': CustomEvent
    'sc-idb-tcommit': CustomEvent
    'sc-idb-tdelete': CustomEvent
    'sc-idb-tget': CustomEvent
    'sc-idb-tget-file': CustomEvent
    'sc-idb-tput': CustomEvent
    'sc-idb-trollback': CustomEvent
    'sc-idb-tsync-local': CustomEvent
    'sc-idb-tsync-remote': CustomEvent
  }
}

interface Diff {
  add: Struct[]
  delete: Struct[]
  put: Struct[]
}

type Migration = (database: IDBPDatabase) => Promise<void>

export class ScolaIdbElement extends HTMLObjectElement implements ScolaElement {
  public static migrations: Partial<Struct<Migration>> = {}

  public database?: IDBPDatabase

  public i18n: I18n

  public mkey: string

  public mutator: Mutator

  public name: string

  public observer: Observer

  public pkey: string

  public propagator: Propagator

  public rkey: string | null

  public version: number

  public get nameVersion (): string {
    return `${this.name}-${this.version}`
  }

  protected handleAddAllBound = this.handleAddAll.bind(this)

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleDeleteAllBound = this.handleDeleteAll.bind(this)

  protected handleDeleteBound = this.handleDelete.bind(this)

  protected handleDownloadBound = this.handleDownload.bind(this)

  protected handleErrorBound = this.handleError.bind(this)

  protected handleGetAllBound = this.handleGetAll.bind(this)

  protected handleGetBound = this.handleGet.bind(this)

  protected handlePutAllBound = this.handlePutAll.bind(this)

  protected handlePutBound = this.handlePut.bind(this)

  protected handleTAddBound = this.handleTAdd.bind(this)

  protected handleTCommitBound = this.handleTCommit.bind(this)

  protected handleTDeleteBound = this.handleTDelete.bind(this)

  protected handleTGetBound = this.handleTGet.bind(this)

  protected handleTGetFileBound = this.handleTGetFile.bind(this)

  protected handleTPutBound = this.handleTPut.bind(this)

  protected handleTRollbackBound = this.handleTRollback.bind(this)

  protected handleTSyncLocalBound = this.handleTSyncLocal.bind(this)

  protected handleTSyncRemoteBound = this.handleTSyncRemote.bind(this)

  public constructor () {
    super()
    this.i18n = new I18n()
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

  public async add (item: Struct): Promise<Struct | undefined> {
    const database = await this.getDatabase()
    const key = await database.add(this.nameVersion, item)

    this.notify()
    return database.get(this.nameVersion, key) as Promise<Struct | undefined>
  }

  public async addAll (items: unknown[]): Promise<unknown[]> {
    const database = await this.getDatabase()

    const newItems = await Promise.all(items.map(async (item) => {
      if (isStruct(item)) {
        const key = await database.add(this.nameVersion, item)
        return database.get(this.nameVersion, key) as Promise<unknown>
      }

      return undefined
    }))

    this.notify()
    return newItems
  }

  public async clear (): Promise<void> {
    const database = await this.getDatabase()

    await database.clear(this.nameVersion)
    this.notify()
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public async delete (item: Struct): Promise<Struct | undefined> {
    const key = item[this.pkey]

    if (!this.isKey(key)) {
      return undefined
    }

    const database = await this.getDatabase()
    const oldItem = await database.get(this.nameVersion, key) as Struct | undefined

    await database.delete(this.nameVersion, key)
    this.notify()
    return oldItem
  }

  public async deleteAll (items: unknown[]): Promise<unknown[]> {
    const database = await this.getDatabase()

    const oldItems = await Promise.all(items.map(async (item) => {
      if (isStruct(item)) {
        const key = item[this.pkey]

        if (!this.isKey(key)) {
          return undefined
        }

        const oldItem = (await database.get(this.nameVersion, key)) as unknown

        await database.delete(this.nameVersion, key)
        return oldItem
      }

      return undefined
    }))

    this.notify()
    return oldItems
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
    this.close()
  }

  public async get (item: Struct): Promise<Struct | undefined> {
    const key = item[this.pkey]

    if (!this.isKey(key)) {
      return undefined
    }

    const database = await this.getDatabase()
    return database.get(this.nameVersion, key) as Promise<Struct | undefined>
  }

  public async getAll (query?: Query): Promise<unknown[]> {
    const database = await this.getDatabase()

    let items = await database.getAll(this.nameVersion) as Struct[]

    if (query?.join?.[this.rkey ?? ''] !== undefined) {
      items = items.filter((item) => {
        return cast(item[this.rkey ?? '']) === cast(query.join?.[this.rkey ?? ''])
      })
    }

    if (query?.where !== undefined) {
      items = this.i18n.filter(items, query)
    }

    if (query?.order !== undefined) {
      items = this.i18n.sort(items, query)
    }

    if (query?.limit !== undefined) {
      items = items.slice(query.offset ?? 0, (query.offset ?? 0) + query.limit)
    }

    return items
  }

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatch('update')
  }

  public async put (item: Struct): Promise<Struct | undefined> {
    const key = item[this.pkey]

    if (!this.isKey(key)) {
      return undefined
    }

    const database = await this.getDatabase()

    await database.put(this.nameVersion, item)
    this.notify()
    return database.get(this.nameVersion, key) as Promise<Struct | undefined>
  }

  public async putAll (items: unknown[]): Promise<unknown[]> {
    const database = await this.getDatabase()

    const newItems = await Promise.all(items.map(async (item) => {
      if (isStruct(item)) {
        const key = item[this.pkey]

        if (!this.isKey(key)) {
          return undefined
        }

        await database.put(this.nameVersion, item)
        return database.get(this.nameVersion, key) as Promise<unknown>
      }

      return undefined
    }))

    this.notify()
    return newItems
  }

  public reset (): void {
    this.mkey = this.getAttribute('sc-mkey') ?? 'updated'
    this.name = this.getAttribute('sc-name') ?? 'idb'
    this.pkey = this.getAttribute('sc-pkey') ?? 'id'
    this.rkey = this.getAttribute('sc-rkey')
    this.version = Number(this.getAttribute('sc-version') ?? 1)
  }

  public toJSON (): unknown {
    return {
      id: this.id,
      is: this.getAttribute('is'),
      mkey: this.mkey,
      name: this.name,
      nodeName: this.nodeName,
      pkey: this.pkey,
      rkey: this.rkey,
      version: this.version
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-idb-add', this.handleAddBound)
    this.addEventListener('sc-idb-add-all', this.handleAddAllBound)
    this.addEventListener('sc-idb-clear', this.handleClearBound)
    this.addEventListener('sc-idb-delete', this.handleDeleteBound)
    this.addEventListener('sc-idb-delete-all', this.handleDeleteAllBound)
    this.addEventListener('sc-idb-download', this.handleDownloadBound)
    this.addEventListener('sc-idb-get', this.handleGetBound)
    this.addEventListener('sc-idb-get-all', this.handleGetAllBound)
    this.addEventListener('sc-idb-put', this.handlePutBound)
    this.addEventListener('sc-idb-put-all', this.handlePutAllBound)
    this.addEventListener('sc-idb-tadd', this.handleTAddBound)
    this.addEventListener('sc-idb-tcommit', this.handleTCommitBound)
    this.addEventListener('sc-idb-tdelete', this.handleTDeleteBound)
    this.addEventListener('sc-idb-tget', this.handleTGetBound)
    this.addEventListener('sc-idb-tget-file', this.handleTGetFileBound)
    this.addEventListener('sc-idb-tput', this.handleTPutBound)
    this.addEventListener('sc-idb-trollback', this.handleTRollbackBound)
    this.addEventListener('sc-idb-tsync-local', this.handleTSyncLocalBound)
    this.addEventListener('sc-idb-tsync-remote', this.handleTSyncRemoteBound)
  }

  protected close (): void {
    if (this.database !== undefined) {
      this.database.close()
      this.database.onerror = null
      this.database = undefined
    }
  }

  protected async commit (transaction: Transaction): Promise<void> {
    switch (transaction.type) {
      case 'tadd':
        await this.commitAdd(transaction)
        break
      case 'tadd-all':
        await this.commitAddAll(transaction)
        break
      case 'tdelete':
        this.commitDelete(transaction)
        break
      case 'tdelete-all':
        this.commitDeleteAll(transaction)
        break
      case 'tget':
        await this.commitGet(transaction)
        break
      case 'tget-file':
        await this.commitGetFile(transaction)
        break
      case 'tput':
        await this.commitPut(transaction)
        break
      case 'tput-all':
        await this.commitPutAll(transaction)
        break
      case 'tsync-local':
        await this.commitSyncLocal(transaction)
        break
      case 'tsync-remote':
        await this.commitSyncRemote(transaction)
        break
      default:
        break
    }
  }

  protected async commitAdd (transaction: Transaction): Promise<void> {
    if (
      isStruct(transaction.commit) &&
      isStruct(transaction.result)
    ) {
      await this.delete(transaction.commit)
      await this.put(transaction.result)
      this.propagator.dispatch('delete', [transaction.commit])
      this.propagator.dispatch('add', [transaction.result])
    }
  }

  protected async commitAddAll (transaction: Transaction): Promise<void> {
    if (
      isArray(transaction.commit) &&
      isArray(transaction.result)
    ) {
      await this.deleteAll(transaction.commit)
      await this.addAll(transaction.result)
      this.propagator.dispatch('deleteall', [transaction.commit])
      this.propagator.dispatch('addall', [transaction.result])
    }
  }

  protected commitDelete (transaction: Transaction): void {
    if (isStruct(transaction.result)) {
      this.propagator.dispatch('delete', [transaction.result])
    }
  }

  protected commitDeleteAll (transaction: Transaction): void {
    if (isArray(transaction.result)) {
      this.propagator.dispatch('deleteall', [transaction.result])
    }
  }

  protected async commitGet (transaction: Transaction): Promise<void> {
    if (isStruct(transaction.result)) {
      await this.put(transaction.result)
      this.propagator.dispatch('get', [transaction.result])
    }
  }

  protected async commitGetFile (transaction: Transaction): Promise<void> {
    if (
      isStruct(transaction.commit) &&
      transaction.result instanceof Blob
    ) {
      const item = await this.get(transaction.commit)

      if (
        isStruct(item) &&
        typeof transaction.commit.file === 'string'
      ) {
        const file = item[transaction.commit.file]

        if (isFile(file)) {
          item[transaction.commit.file] = new File([transaction.result], file.name, {
            type: file.type
          })

          await this.put(item)
          this.propagator.dispatch('getfile', [item])
        }
      }
    }
  }

  protected async commitPut (transaction: Transaction): Promise<void> {
    if (isStruct(transaction.result)) {
      await this.put(transaction.result)
      this.propagator.dispatch('put', [transaction.result])
    }
  }

  protected async commitPutAll (transaction: Transaction): Promise<void> {
    if (isArray(transaction.result)) {
      await this.putAll(transaction.result)
      this.propagator.dispatch('putall', [transaction.result])
    }
  }

  protected async commitSyncLocal (transaction: Transaction): Promise<void> {
    if (
      isStruct(transaction.commit) &&
      isArray(transaction.result)
    ) {
      const options = transaction.commit
      const localItems = await this.getAll()

      const diff = this.diff(localItems, transaction.result, (left, right) => {
        return (
          left[`${this.mkey}_local`] !== undefined ||
          !isSame(left[this.mkey], right[this.mkey])
        )
      })

      Object
        .entries(diff)
        .forEach(([type, items]: [string, Struct[]]) => {
          if (
            cast(options[type]) === true &&
            items.length > 0
          ) {
            const dispatched = this.propagator.dispatch(`tsynclocal${type}items`, [items])

            if (!dispatched) {
              this.propagator.dispatch(`tsynclocal${type}item`, items)
            }
          }
        })
    }
  }

  protected async commitSyncRemote (transaction: Transaction): Promise<void> {
    if (
      isStruct(transaction.commit) &&
      isArray(transaction.result)
    ) {
      const options = transaction.commit
      const localItems = await this.getAll()

      const diff = this.diff(transaction.result, localItems, (left, right) => {
        return (
          right[`${this.mkey}_local`] !== undefined ||
          !isSame(left[this.mkey], right[this.mkey])
        )
      })

      Object
        .entries(diff)
        .forEach(([type, items]: [string, Struct[]]) => {
          if (
            cast(options[type]) === true &&
            items.length > 0
          ) {
            const dispatched = this.propagator.dispatch<Transaction>(`tsyncremote${type}items`, [{
              commit: items,
              type: `t${type}-all`
            }])

            if (!dispatched) {
              this.propagator.dispatch<Transaction>(`tsyncremote${type}item`, items.map((item) => {
                return {
                  commit: item,
                  type: `t${type}`
                }
              }))
            }
          }
        })
    }
  }

  protected diff (left: unknown[], right: unknown[], isModified: (left: Struct, right: Struct) => boolean): Diff {
    const diff: Diff = {
      add: [],
      delete: [],
      put: []
    }

    const rightItems: Struct[] = []

    const leftIds = left.map((leftItem) => {
      if (isStruct(leftItem)) {
        return leftItem[this.pkey]
      }

      return null
    })

    const rightIds = right.map((rightItem) => {
      if (isStruct(rightItem)) {
        const id = rightItem[this.pkey]

        if (!leftIds.includes(id)) {
          diff.add.push(rightItem)
        }

        rightItems.push(rightItem)
        return id
      }

      return null
    })

    left.forEach((leftItem) => {
      if (isStruct(leftItem)) {
        const index = rightIds.indexOf(leftItem[this.pkey])

        if (index > -1) {
          const rightItem = rightItems[index]

          if (isModified(leftItem, rightItem)) {
            diff.put.push(rightItem)
          }
        } else {
          diff.delete.push(leftItem)
        }
      }
    })

    return diff
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
        .then((item) => {
          this.propagator.dispatch('add', [item], event)
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
        .then((items) => {
          this.propagator.dispatch('addall', [items], event)
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
        .then((item) => {
          this.propagator.dispatch('delete', [item], event)
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
        .then((items) => {
          this.propagator.dispatch('deleteall', [items], event)
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleDownload (event: CustomEvent): void {
    Promise
      .resolve()
      .then(async () => {
        if (isStruct(event.detail)) {
          const item = await this.get(event.detail)

          if (
            isStruct(item) &&
            typeof event.detail.file === 'string'
          ) {
            const file = item[event.detail.file]

            if (file instanceof File) {
              saveAs(file)
            } else if (isFile(file)) {
              this.propagator.dispatch('download', [event.detail], event)
            }
          }
        }
      })
      .catch((error) => {
        this.handleError(error)
      })
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch('error', [{
      code: 'err_idb',
      message: toString(error)
    }])
  }

  protected handleGet (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this
        .get(event.detail)
        .then((item) => {
          this.propagator.dispatch('get', [item], event)
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleGetAll (event: CustomEvent): void {
    let query: Query = {
      limit: 10
    }

    if (isQuery(event.detail)) {
      query = {
        ...query,
        ...event.detail
      }
    }

    this
      .getAll(query)
      .then((items) => {
        this.propagator.dispatch('getall', [items], event)
      })
      .catch((error) => {
        this.handleError(error)
      })
  }

  protected handlePut (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this
        .put(event.detail)
        .then((item) => {
          this.propagator.dispatch('put', [item], event)
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
        .then((items) => {
          this.propagator.dispatch('putall', [items], event)
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
        .then((item) => {
          if (isStruct(item)) {
            const transaction = {
              commit: item,
              rollback: item,
              type: 'tadd'
            }

            this.propagator.dispatch('add', [item], event)
            this.propagator.dispatch('tadd', [transaction], event)
          }
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleTCommit (event: CustomEvent): void {
    if (isTransaction(event.detail)) {
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
        .delete(event.detail)
        .then((item) => {
          if (isStruct(item)) {
            const transaction = {
              commit: item,
              rollback: item,
              type: 'tdelete'
            }

            this.propagator.dispatch('delete', [item], event)
            this.propagator.dispatch('tdelete', [transaction], event)
          }
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleTGet (event: CustomEvent<unknown>): void {
    if (isStruct(event.detail)) {
      this
        .get(event.detail)
        .then((item) => {
          if (isStruct(item)) {
            const transaction = {
              commit: event.detail,
              type: 'tget'
            }

            this.propagator.dispatch('get', [item], event)
            this.propagator.dispatch('tget', [transaction], event)
          }
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleTGetFile (event: CustomEvent<unknown>): void {
    const transaction = {
      commit: event.detail,
      type: 'tget-file'
    }

    this.propagator.dispatch('tgetfile', [transaction], event)
  }

  protected handleTPut (event: CustomEvent): void {
    Promise
      .resolve()
      .then(async () => {
        if (isStruct(event.detail)) {
          const oldItem = await this.get(event.detail)
          const newItem = await this.put(event.detail)

          if (
            isStruct(newItem) &&
            isStruct(oldItem)
          ) {
            const transaction = {
              commit: newItem,
              rollback: oldItem,
              type: 'tput'
            }

            this.propagator.dispatch('put', [newItem], event)
            this.propagator.dispatch('tput', [transaction], event)
          }
        }
      })
      .catch((error) => {
        this.handleError(error)
      })
  }

  protected handleTRollback (event: CustomEvent): void {
    if (isTransaction(event.detail)) {
      this
        .rollback(event.detail)
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected handleTSyncLocal (event: CustomEvent<unknown>): void {
    const transaction = {
      commit: event.detail,
      type: 'tsync-local'
    }

    this.propagator.dispatch('tsynclocal', [transaction], event)
  }

  protected handleTSyncRemote (event: CustomEvent<unknown>): void {
    const transaction = {
      commit: event.detail,
      type: 'tsync-remote'
    }

    this.propagator.dispatch('tsyncremote', [transaction], event)
  }

  protected isKey (value: unknown): value is IDBValidKey {
    return (
      isNumber(value) ||
      typeof value === 'string'
    )
  }

  protected async open (): Promise<IDBPDatabase> {
    let migration: Migration | null = null

    this.database = await openDB(this.name, this.version, {
      upgrade: (database, oldVersion, newVersion) => {
        migration = ScolaIdbElement.migrations[`${this.name}_${oldVersion}_${newVersion ?? 0}`] ?? null

        database.createObjectStore(this.nameVersion, {
          autoIncrement: true,
          keyPath: this.pkey
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
    this.removeEventListener('sc-idb-download', this.handleDownloadBound)
    this.removeEventListener('sc-idb-get', this.handleGetBound)
    this.removeEventListener('sc-idb-get-all', this.handleGetAllBound)
    this.removeEventListener('sc-idb-put', this.handlePutBound)
    this.removeEventListener('sc-idb-put-all', this.handlePutAllBound)
    this.removeEventListener('sc-idb-tadd', this.handleTAddBound)
    this.removeEventListener('sc-idb-tcommit', this.handleTCommitBound)
    this.removeEventListener('sc-idb-tdelete', this.handleTDeleteBound)
    this.removeEventListener('sc-idb-tget', this.handleTGetBound)
    this.removeEventListener('sc-idb-tget-file', this.handleTGetFileBound)
    this.removeEventListener('sc-idb-tput', this.handleTPutBound)
    this.removeEventListener('sc-idb-trollback', this.handleTRollbackBound)
    this.removeEventListener('sc-idb-tsync-local', this.handleTSyncLocalBound)
    this.removeEventListener('sc-idb-tsync-remote', this.handleTSyncRemoteBound)
  }

  protected async rollback (transaction: Transaction): Promise<void> {
    switch (transaction.type) {
      case 'tadd':
        await this.rollbackAdd(transaction)
        break
      case 'tadd-all':
        await this.rollbackAddAll(transaction)
        break
      case 'tdelete':
        await this.rollbackDelete(transaction)
        break
      case 'tdelete-all':
        await this.rollbackDeleteAll(transaction)
        break
      case 'tput':
        await this.rollbackPut(transaction)
        break
      case 'tput-all':
        await this.rollbackPutAll(transaction)
        break
      default:
        break
    }
  }

  protected async rollbackAdd (transaction: Transaction): Promise<void> {
    if (isStruct(transaction.rollback)) {
      await this.delete(transaction.rollback)
      this.propagator.dispatch('delete', [transaction.rollback])
    }
  }

  protected async rollbackAddAll (transaction: Transaction): Promise<void> {
    if (isArray(transaction.rollback)) {
      await this.deleteAll(transaction.rollback)
      this.propagator.dispatch('deleteall', [transaction.rollback])
    }
  }

  protected async rollbackDelete (transaction: Transaction): Promise<void> {
    if (isStruct(transaction.rollback)) {
      await this.add(transaction.rollback)
      this.propagator.dispatch('add', [transaction.rollback])
    }
  }

  protected async rollbackDeleteAll (transaction: Transaction): Promise<void> {
    if (isArray(transaction.rollback)) {
      await this.addAll(transaction.rollback)
      this.propagator.dispatch('addall', [transaction.rollback])
    }
  }

  protected async rollbackPut (transaction: Transaction): Promise<void> {
    if (isStruct(transaction.rollback)) {
      await this.put(transaction.rollback)
      this.propagator.dispatch('put', [transaction.rollback])
    }
  }

  protected async rollbackPutAll (transaction: Transaction): Promise<void> {
    if (isArray(transaction.rollback)) {
      await this.putAll(transaction.rollback)
      this.propagator.dispatch('putall', [transaction.rollback])
    }
  }
}
