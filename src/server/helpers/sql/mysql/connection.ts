import type { Connection, DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise'
import type { Readable } from 'stream'

export class MysqlConnection implements Connection {
  public connection: PoolConnection

  public constructor (connection: PoolConnection) {
    this.connection = connection
  }

  public async delete (query: string, values: unknown = []): Promise<DeleteResult> {
    const result = await this.query<ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }

  public async insert (query: string, values: unknown = []): Promise<InsertResult[]> {
    const result = await this.query<ResultSetHeader>(query, values)
    return [{ id: result.insertId }]
  }

  public async insertOne (query: string, values: unknown = []): Promise<InsertResult> {
    const result = await this.query<ResultSetHeader>(query, values)
    return { id: result.insertId }
  }

  public async query<T>(query: string, values: unknown = []): Promise<T> {
    const [result] = await this.connection.query(query, values) as unknown as [T]
    return result
  }

  public release (): void {
    this.connection.release()
  }

  public async select<T>(query: string, values: unknown = []): Promise<T> {
    return this.query<T>(query, values)
  }

  public async selectOne<T>(query: string, values: unknown = []): Promise<T | undefined> {
    const result = await this.query<T[]>(query, values)
    return result[0]
  }

  public async stream (query: string, values: unknown = []): Promise<Readable> {
    const stream = this.connection.connection
      .query(query, values)
      .stream()

    return Promise.resolve(stream)
  }

  public async update (query: string, values: unknown = []): Promise<UpdateResult> {
    const result = await this.query<ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }
}
