import type { IDBPDatabase } from 'idb'
import type { ScolaTransactionElement } from '../elements'
import type { Struct } from '../../common'
import { isStruct } from '../../common'
import { openDB } from 'idb'

export interface TransactionOptions {
  data: Struct
  id?: IDBValidKey
  type: string
}

export class Transaction {
  public data: Struct

  public element: ScolaTransactionElement

  public id?: IDBValidKey

  public result?: unknown

  public type: string

  public get name (): string {
    return `${this.element.name}-t`
  }

  public constructor (element: ScolaTransactionElement, options: TransactionOptions) {
    this.element = element
    this.data = options.data
    this.id = options.id
    this.type = options.type
  }

  public static async getAll (element: ScolaTransactionElement): Promise<Transaction[]> {
    const database = await Transaction.open(element)

    const transactions = (await database.getAll(`${element.name}-t`))
      .filter((options) => {
        return isStruct(options)
      })
      .map((options) => {
        return new Transaction(element, options as TransactionOptions)
      })

    database.close()
    return transactions
  }

  public static async open (element: ScolaTransactionElement): Promise<IDBPDatabase> {
    return openDB(`${element.name}-t`, 1, {
      upgrade: (database) => {
        database.createObjectStore(`${element.name}-t`, {
          autoIncrement: true,
          keyPath: 'id'
        })
      }
    })
  }

  public async delete (): Promise<void> {
    const database = await Transaction.open(this.element)

    if (this.id !== undefined) {
      await database.delete(this.name, this.id)
    }

    database.close()
  }

  public async put (): Promise<void> {
    const database = await Transaction.open(this.element)

    this.id = await database.put(this.name, {
      data: this.data,
      type: this.type
    })

    database.close()
  }
}
