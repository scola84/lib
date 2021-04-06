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

  public async delete<V> (query: string, values: Partial<V>): Promise<DeleteResult> {
    const result = await this.query<V, ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }

  public async insert<V, R = number> (query: string, values: Partial<V>): Promise<Array<InsertResult<R>>> {
    const result = await this.query<V, { insertId: R }>(query, values)
    return [{ id: result.insertId }]
  }

  public async insertOne<V, R = number> (query: string, values: Partial<V>): Promise<InsertResult<R>> {
    const result = await this.query<V, { insertId: R }>(query, values)
    return { id: result.insertId }
  }

  public async query<V, R>(query: string, values: Partial<V>): Promise<R> {
    const [result] = await this.connection.query(...this.transformParameters(query, values as unknown as [])) as unknown as [R]
    return result
  }

  public async release (): Promise<void> {
    this.connection.release()
    return Promise.resolve()
  }

  public async select<V, R>(query: string, values: Partial<V>): Promise<R> {
    return this.query<V, R>(query, values)
  }

  public async selectOne<V, R>(query: string, values: Partial<V>): Promise<R | undefined> {
    const result = await this.query<V, R[]>(query, values)
    return result[0]
  }

  public async stream<V> (query: string, values: Partial<V>): Promise<Readable> {
    const stream = this.connection.connection
      .query(...this.transformParameters(query, values as unknown as []))
      .stream()

    return Promise.resolve(stream)
  }

  public transformParameters (rawQuery: string, rawValues: Record<string, unknown> | unknown[]): [string, unknown[]] {
    if (rawValues instanceof Array) {
      return this.transformParametersArray(rawQuery, rawValues)
    }

    return this.transformParametersObject(rawQuery, rawValues)
  }

  public async update<V> (query: string, values: Partial<V>): Promise<UpdateResult> {
    const result = await this.query<V, ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }

  protected transformParametersArray (rawQuery: string, rawValues: unknown[]): [string, unknown[]] {
    return [
      rawQuery
        .replace(/\$\d+/gu, '?'),
      rawQuery
        .match(/\$\d+/gu)
        ?.map((index) => {
          const value = rawValues[Number(index.slice(1)) - 1]

          if (value === undefined) {
            throw new Error(`Parameter "${index}" is undefined`)
          }

          return value
        }) ?? rawValues
    ]
  }

  protected transformParametersObject (rawQuery: string, rawValues: Record<string, unknown>): [string, unknown[]] {
    return [
      rawQuery
        .replace(/\$\(\w+\)/gu, '?'),
      rawQuery
        .match(/\$\(\w+\)/gu)
        ?.map((index) => {
          const value = rawValues[index.slice(2, -1)]

          if (value === undefined) {
            throw new Error(`Parameter "${index}" is undefined`)
          }

          return value
        }) ?? Object.values(rawValues)
    ]
  }
}
