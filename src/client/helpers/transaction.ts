import type { IDBPDatabase } from 'idb'
import type { Struct } from '../../common'
import { isStruct } from '../../common'
import { openDB } from 'idb'

export interface TransactionOptions {
  commit: Struct
  id?: IDBValidKey
  name: string
  rollback: Struct
  result?: unknown
  type: string
}

export class Transaction {
  public commit: Struct

  public id?: IDBValidKey

  public name: string

  public result?: unknown

  public rollback: Struct

  public type: string

  public constructor (options: TransactionOptions) {
    this.commit = options.commit
    this.rollback = options.rollback
    this.id = options.id
    this.name = options.name
    this.result = options.result
    this.type = options.type
  }

  public static async getAll (name: string): Promise<Transaction[]> {
    const database = await Transaction.open(name)

    const transactions = (await database.getAll(`${name}-t`))
      .filter((options) => {
        return isStruct(options)
      })
      .map((options) => {
        return new Transaction(options as TransactionOptions)
      })

    database.close()
    return transactions
  }

  public static async open (name: string): Promise<IDBPDatabase> {
    return openDB(`${name}-t`, 1, {
      upgrade: (database) => {
        database.createObjectStore(`${name}-t`, {
          autoIncrement: true,
          keyPath: 'id'
        })
      }
    })
  }

  public async delete (): Promise<void> {
    const database = await Transaction.open(this.name)

    if (this.id !== undefined) {
      await database.delete(`${this.name}-t`, this.id)
    }

    database.close()
  }

  public async put (): Promise<void> {
    const database = await Transaction.open(this.name)

    this.id = await database.put(`${this.name}-t`, {
      commit: this.commit,
      name: this.name,
      rollback: this.rollback,
      type: this.type
    })

    database.close()
  }
}
