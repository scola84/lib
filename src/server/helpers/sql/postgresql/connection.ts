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

  public async delete (query: string, values: unknown[] = []): Promise<DeleteResult> {
    await this.query(query, values)
    return { count: 0 }
  }

  public async insert (query: string, values: unknown[] = []): Promise<InsertResult[]> {
    const result = await this.query<InsertResult[]>(...this.transformInsert(query, values))
    return result
  }

  public async insertOne (query: string, values: unknown[] = []): Promise<InsertResult> {
    const result = await this.query<InsertResult[]>(...this.transformInsert(query, values))
    return result[0]
  }

  public async query<T = unknown>(query: string, values: unknown[]): Promise<T> {
    return this.connection.query<T>(query, values)
  }

  public release (): void {
    this.connection.done()
  }

  public async select<T>(query: string, values: unknown[] = []): Promise<T> {
    return this.query<T>(query, values)
  }

  public async selectOne<T>(query: string, values: unknown[] = []): Promise<T | undefined> {
    const result = await this.query<T[]>(query, values)
    return result[0]
  }

  public async stream (query: string, values: unknown[] = []): Promise<Readable> {
    return new Promise((resolve, reject) => {
      this.connection.stream(new PgQueryStream(query, values as []), (stream) => {
        resolve(stream as Readable)
      }).catch((error: unknown) => {
        this.release()
        reject(error)
      })
    })
  }

  public transformInsert (query: string, values: unknown[]): [string, unknown[]] {
    return [`${query} RETURNING id`, values]
  }

  public async update (query: string, values: unknown[] = []): Promise<UpdateResult> {
    await this.query(query, values)
    return { count: 0 }
  }
}
