import type { Connection, DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { IClient } from 'pg-promise/typescript/pg-subset'
import type { IConnected } from 'pg-promise'
import PgQueryStream from 'pg-query-stream'
import type { Readable } from 'stream'
import tokens from './tokens'

export class PostgresqlConnection implements Connection {
  public connection: IConnected<unknown, IClient>

  public tokens = tokens

  public constructor (connection?: IConnected<unknown, IClient>) {
    if (connection !== undefined) {
      this.connection = connection
    }
  }

  public async delete<V> (query: string, values: Partial<V>): Promise<DeleteResult> {
    await this.query(query, values)
    return { count: 0 }
  }

  public async insert<V, R = number> (query: string, values: Partial<V>): Promise<Array<InsertResult<R>>> {
    const result = await this.query<V, Array<InsertResult<R>>>(...this.transformInsert(query, values))
    return result
  }

  public async insertOne<V, R = number> (query: string, values: Partial<V>): Promise<InsertResult<R>> {
    const result = await this.query<V, Array<InsertResult<R>>>(...this.transformInsert(query, values))
    return result[0]
  }

  public async query<V, R>(query: string, values: Partial<V>): Promise<R> {
    return this.connection.query<R>(query, values)
  }

  public release (): void {
    return this.connection.done() as undefined
  }

  public async select<V, R>(query: string, values: Partial<V>): Promise<R> {
    return this.query<V, R>(query, values)
  }

  public async selectOne<V, R>(query: string, values: Partial<V>): Promise<R | undefined> {
    const result = await this.query<V, R[]>(query, values)
    return result[0]
  }

  public async stream<V> (query: string, values: Partial<V>): Promise<Readable> {
    return new Promise((resolve, reject) => {
      this.connection.stream(new PgQueryStream(query, values as unknown as []), (stream) => {
        resolve(stream as Readable)
      }).catch((error: unknown) => {
        this.release()
        reject(error)
      })
    })
  }

  public transformInsert<V> (query: string, values: V): [string, V] {
    return [`${query} RETURNING id`, values]
  }

  public async update<V> (query: string, values: V): Promise<UpdateResult> {
    await this.query(query, values)
    return { count: 0 }
  }
}
