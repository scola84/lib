import type { DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { IResult, Request } from 'mssql'
import { Connection } from '../connection'
import type { Readable } from 'stream'
import { Transform } from 'stream'
import { escape } from 'sqlstring'
import lodash from 'lodash'
import tokens from './tokens'

export class MssqlConnection extends Connection {
  public connection: Request

  public tokens = tokens

  public constructor (connection: Request) {
    super()
    this.connection = connection
  }

  public async delete<V> (query: string, values?: Partial<V>): Promise<DeleteResult> {
    const result = await this.query<V, IResult<unknown>>(query, values)
    return { count: result.rowsAffected[0] }
  }

  public formatValue (value: unknown): string {
    return escape(lodash.isPlainObject(value) || typeof value === 'boolean'
      ? JSON.stringify(value)
      : value)
  }

  public async insert<V, R = number> (query: string, values?: Partial<V>): Promise<Array<InsertResult<R>>> {
    const result = await this.query<V, IResult<{ id: R }>>(`${query}; SELECT SCOPE_IDENTITY() AS id;`, values)
    return result.recordset
  }

  public async insertOne<V, R = number> (query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const result = await this.query<V, IResult<{ id: R }>>(`${query}; SELECT SCOPE_IDENTITY() AS id;`, values)
    return result.recordset[0]
  }

  public async query<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const result = await this.connection.query(this.format(query, values))
    return result as unknown as R
  }

  public release (): void {
    this.connection.cancel()
  }

  public async select<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const result = await this.query<V, IResult<R>>(query, values)
    return result.recordset as unknown as R
  }

  public async selectOne<V, R>(query: string, values?: Partial<V>): Promise<R | undefined> {
    const result = await this.query<V, IResult<R>>(query, values)
    return result.recordset[0]
  }

  public stream<V> (query: string, values?: Partial<V>): Readable {
    this.connection.stream = true

    const transform = new Transform({
      objectMode: true,
      transform (chunk, encoding, callback) {
        callback(null, chunk)
      }
    })

    this.connection.pipe(transform)
    // eslint-disable-next-line no-void
    void this.connection.query(this.format(query, values))

    return transform
  }

  public async update<V> (query: string, values?: Partial<V>): Promise<UpdateResult> {
    const result = await this.query<V, IResult<unknown>>(query, values)
    return { count: result.rowsAffected[0] }
  }
}
