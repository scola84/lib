import type { DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise'
import type { Connection as BaseConnection } from 'mysql'
import { Connection } from '../connection'
import type { Readable } from 'stream'
import tokens from './tokens'

interface StreamConnection extends PoolConnection {
  connection: BaseConnection
}

export class MysqlConnection extends Connection {
  public connection: PoolConnection

  public tokens = tokens

  public constructor (connection: PoolConnection) {
    super()
    this.connection = connection
  }

  public async delete<V> (query: string, values?: Partial<V>): Promise<DeleteResult> {
    const result = await this.query<V, ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }

  public async insert<V, R = number> (query: string, values?: Partial<V>): Promise<Array<InsertResult<R>>> {
    const result = await this.query<V, { insertId: R }>(query, values)
    return [{ id: result.insertId }]
  }

  public async insertOne<V, R = number> (query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const result = await this.query<V, { insertId: R }>(query, values)
    return { id: result.insertId }
  }

  public async query<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const [result] = await this.connection.query(...this.transform(query, values))
    return result as unknown as R
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
    return (this.connection as StreamConnection).connection
      .query(...this.transform(query, values))
      .stream()
  }

  public async update<V> (query: string, values?: Partial<V>): Promise<UpdateResult> {
    const result = await this.query<V, ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }

  protected transformKey (): string {
    return '?'
  }

  protected transformObject (value: unknown): unknown {
    return Array.isArray(value) || value === null ? value : JSON.stringify(value)
  }
}
