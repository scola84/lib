import type { DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise'
import type { Connection as BaseConnection } from 'mysql'
import { Connection } from '../connection'
import type { Readable } from 'stream'
import { format } from '../format'
import { format as formatValue } from './format'
import tokens from './tokens'

interface StreamConnection extends PoolConnection {
  connection: BaseConnection
}

export class MysqlConnection extends Connection {
  public connection: PoolConnection

  public format = format(formatValue)

  public tokens = tokens

  public constructor (connection: PoolConnection) {
    super()
    this.connection = connection
  }

  public async delete<V>(query: string, values?: Partial<V>): Promise<DeleteResult> {
    const result = await this.query<V, ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }

  public async insert<V, R = number>(query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const result = await this.query<V, { insertId: R }>(query, values)
    return { id: result.insertId }
  }

  public async insertAll<V, R = number>(query: string, values?: Partial<V>): Promise<Array<InsertResult<R>>> {
    const result = await this.query<V, { insertId: R }>(query, values)
    return [{ id: result.insertId }]
  }

  public async insertOne<V, R = number>(query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const result = await this.query<V, { insertId: R }>(query, values)
    return { id: result.insertId }
  }

  public async query<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const [result] = await this.connection.query(this.format(query, values))
    return result as unknown as R
  }

  public release (): void {
    this.connection.release()
  }

  public async select<V, R>(query: string, values?: Partial<V>): Promise<R | undefined> {
    const [object] = await this.query<V, R[]>(query, values)
    return object
  }

  public async selectAll<V, R>(query: string, values?: Partial<V>): Promise<R[]> {
    return this.query<V, R[]>(query, values)
  }

  public async selectOne<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const [object] = await this.query<V, R[]>(query, values)

    if (object === undefined) {
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<V>(query: string, values?: Partial<V>): Readable {
    return (this.connection as StreamConnection).connection
      .query(this.format(query, values))
      .stream()
  }

  public async update<V>(query: string, values?: Partial<V>): Promise<UpdateResult> {
    const result = await this.query<V, ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }
}
