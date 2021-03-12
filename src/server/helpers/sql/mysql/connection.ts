import type { Connection, DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise'
import type { Readable } from 'stream'
import tokens from './tokens'

export class MysqlConnection implements Connection {
  public connection: PoolConnection

  public tokens = tokens

  public constructor (connection?: PoolConnection) {
    if (connection !== undefined) {
      this.connection = connection
    }
  }

  public async delete (query: string, values: unknown[] = []): Promise<DeleteResult> {
    const result = await this.query<ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }

  public async insert (query: string, values: unknown[] = []): Promise<InsertResult[]> {
    const result = await this.query<ResultSetHeader>(query, values)
    return [{ id: result.insertId }]
  }

  public async insertOne (query: string, values: unknown[] = []): Promise<InsertResult> {
    const result = await this.query<ResultSetHeader>(query, values)
    return { id: result.insertId }
  }

  public async query<T>(query: string, values: unknown[] = []): Promise<T> {
    const [result] = await this.connection
      .query(...this.transformPlaceholders(query, values)) as unknown as [T]
    return result
  }

  public release (): void {
    this.connection.release()
  }

  public async select<T>(query: string, values: unknown[] = []): Promise<T> {
    return this.query<T>(query, values)
  }

  public async selectOne<T>(query: string, values: unknown[] = []): Promise<T | undefined> {
    const result = await this.query<T[]>(query, values)
    return result[0]
  }

  public async stream (query: string, values: unknown = []): Promise<Readable> {
    const stream = this.connection.connection
      .query(query, values)
      .stream()

    return Promise.resolve(stream)
  }

  public transformPlaceholders (rawQuery: string, rawValues: unknown[] = []): [string, unknown[]] {
    return [
      rawQuery
        .replace(/\$\d+/gu, '?'),
      rawQuery
        .match(/\$\d+/gu)
        ?.map((index) => {
          return rawValues[Number(index.slice(1)) - 1]
        }) ?? rawValues
    ]
  }

  public async update (query: string, values: unknown[] = []): Promise<UpdateResult> {
    const result = await this.query<ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }
}
