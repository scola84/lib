import type { IDBPDatabase } from 'idb/with-async-ittr'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'
import { isStruct } from '../../common'
import { openDB } from 'idb/with-async-ittr'

declare global {
  interface HTMLElementEventMap {
    'sc-idb-add': CustomEvent
    'sc-idb-clear': CustomEvent
    'sc-idb-delete': CustomEvent
    'sc-idb-get': CustomEvent
    'sc-idb-get-all': CustomEvent
    'sc-idb-put': CustomEvent
  }
}

export class ScolaIdbElement extends HTMLObjectElement implements ScolaElement {
  public database?: IDBPDatabase

  public key: string

  public mutator: ScolaMutator

  public name: string

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleDeleteBound = this.handleDelete.bind(this)

  protected handleErrorBound = this.handleError.bind(this)

  protected handleGetAllBound = this.handleGetAll.bind(this)

  protected handleGetBound = this.handleGet.bind(this)

  protected handlePutBound = this.handlePut.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-idb', ScolaIdbElement, {
      extends: 'object'
    })
  }

  public async add (data: Struct): Promise<IDBValidKey> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.add(this.name, data)
      })
      .then((addKey) => {
        this.update()
        return addKey
      })
  }

  public async clear (): Promise<void> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.clear(this.name)
      })
      .then(() => {
        this.update()
      })
  }

  public close (): void {
    if (this.database !== undefined) {
      this.database.close()
      this.database.onerror = null
      this.database = undefined
    }
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public async delete (key: IDBValidKey): Promise<unknown> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.delete(this.name, key)
      })
      .then((deleteKey) => {
        this.update()
        return deleteKey
      })
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
    this.close()
  }

  public async get (key: IDBValidKey): Promise<unknown> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.get(this.name, key)
      })
  }

  public async getAll (): Promise<unknown[]> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.getAll(this.name)
      })
  }

  public getData (): void {}

  public async open (): Promise<IDBPDatabase> {
    this.database = await openDB(this.name, 1, {
      upgrade: (database) => {
        database.createObjectStore(this.name, {
          autoIncrement: true,
          keyPath: this.key
        })
      }
    })

    this.database.onerror = this.handleErrorBound
    return this.database
  }

  public async put (data: Struct): Promise<IDBValidKey> {
    return this
      .getDatabase()
      .then(async (database) => {
        return database.put(this.name, data)
      })
      .then((key) => {
        this.update()
        return key
      })
  }

  public reset (): void {
    this.key = this.getAttribute('sc-key') ?? 'id'
    this.name = this.getAttribute('sc-name') ?? 'idb'
  }

  public setData (): void {}

  public update (): void {
    this.updateAttributes()
    this.propagator.dispatch('update')
  }

  public updateAttributes (): void {
    this.setAttribute('sc-updated', Date.now().toString())
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-idb-add', this.handleAddBound)
    this.addEventListener('sc-idb-clear', this.handleClearBound)
    this.addEventListener('sc-idb-delete', this.handleDeleteBound)
    this.addEventListener('sc-idb-get', this.handleGetBound)
    this.addEventListener('sc-idb-get-all', this.handleGetAllBound)
    this.addEventListener('sc-idb-put', this.handlePutBound)
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
        .then((key) => {
          this.propagator.dispatch('add', [{
            ...event.detail,
            [this.key]: key
          }], event)
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
      const key = event.detail[this.key]

      if (
        typeof key === 'string' ||
        typeof key === 'number'
      ) {
        this
          .delete(key)
          .then(() => {
            this.propagator.dispatch('delete', [event.detail])
          })
          .catch((error) => {
            this.handleError(error)
          })
      }
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
      const key = event.detail[this.key]

      if (
        typeof key === 'string' ||
        typeof key === 'number'
      ) {
        this
          .get(key)
          .then((data) => {
            if (data === undefined) {
              this.propagator.dispatch('request', [event.detail])
            } else {
              this.propagator.dispatch('get', [data])
            }
          })
          .catch((error) => {
            this.handleError(error)
          })
      }
    }
  }

  protected handleGetAll (): void {
    this
      .getAll()
      .then((data) => {
        this.propagator.dispatch('getall', [data])
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
          this.propagator.dispatch('put', [event.detail])
        })
        .catch((error) => {
          this.handleError(error)
        })
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-idb-add', this.handleAddBound)
    this.removeEventListener('sc-idb-clear', this.handleClearBound)
    this.removeEventListener('sc-idb-delete', this.handleDeleteBound)
    this.removeEventListener('sc-idb-get', this.handleGetBound)
    this.removeEventListener('sc-idb-get-all', this.handleGetAllBound)
    this.removeEventListener('sc-idb-put', this.handlePutBound)
  }
}
