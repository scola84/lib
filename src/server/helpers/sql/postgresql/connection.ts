import type { DeleteResult, InsertResult, UpdateResult } from '../connection'
import { Connection } from '../connection'
import PgQueryStream from 'pg-query-stream'
import type { PoolClient } from 'pg'
import type { Readable } from 'stream'
import { literal } from 'pg-format'
import tokens from './tokens'

export class PostgresqlConnection extends Connection {
  public connection: PoolClient

  public tokens = tokens

  public constructor (connection: PoolClient) {
    super()
    this.connection = connection
  }

  public async delete<V> (query: string, values?: Partial<V>): Promise<DeleteResult> {
    await this.query(query, values)
    return { count: 0 }
  }

  public async insert<V, R = number> (query: string, values?: Partial<V>, key = 'id'): Promise<Array<InsertResult<R>>> {
    const result = await this.query<V, Array<InsertResult<R>>>(`${query} RETURNING ${key} AS id`, values)
    return result
  }

  public async insertOne<V, R = number> (query: string, values?: Partial<V>, key = 'id'): Promise<InsertResult<R>> {
    const result = await this.query<V, Array<InsertResult<R>>>(`${query} RETURNING ${key} AS id`, values)
    return result[0]
  }

  public async query<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const { rows } = await this.connection.query(...this.transform(query, values))
    return rows as unknown as R
  }

  public release (): void {
    this.connection.release()
  }

  public async select<V, R>(query: string, values?: Partial<V>): Promise<R> {
    return this.query<V, R>(query, values)
  }

  public async selectOne<V, R>(query: string, values?: Partial<V>): Promise<R | undefined> {
    const result = await this.query<V, R[]>(query, values)
    return result[0]
  }

  public stream<V> (query: string, values?: Partial<V>): Readable {
    return this.connection.query(new PgQueryStream(...this.transform(query, values)))
  }

  public async update<V> (query: string, values?: V): Promise<UpdateResult> {
    await this.query(query, values)
    return { count: 0 }
  }

  protected transformKey (key: string, index: number, value: unknown): string {
    return Array.isArray(value) ? literal(value) : `$${index + 1}`
  }

  protected transformObject (value: unknown): unknown {
    return Array.isArray(value) ? undefined : JSON.stringify(value)
  }
}
