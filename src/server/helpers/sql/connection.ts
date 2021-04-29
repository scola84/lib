import type { Readable } from 'stream'
import type tokens from './tokens'

export interface DeleteResult {
  count: number
}

export interface InsertResult<R = number> {
  id: R
}

export interface UpdateResult {
  count: number
}

export abstract class Connection {
  public abstract tokens: tokens

  public transform (rawQuery: string, rawValues: Record<string, unknown> | unknown[] = {}): [string, unknown[]] {
    if (rawValues instanceof Array) {
      return [rawQuery, rawValues]
    }

    const match = rawQuery.match(/\$\(\w+\)/gu) ?? []
    const values = []

    let key = null
    let query = rawQuery
    let rawKey = null
    let value = null

    for (let index = 0; index < match.length; index += 1) {
      rawKey = match[index]
      key = rawKey.slice(2, -1)
      value = rawValues[key]
      query = query.replace(rawKey, this.transformKey(rawKey, index, value))

      if (value === undefined) {
        throw new Error(`Parameter "${key}" is undefined`)
      }

      if (typeof value === 'object') {
        value = this.transformObject(value)
      }

      if (value !== undefined) {
        values.push(value)
      }
    }

    return [query, values]
  }

  public abstract delete <V> (query: string, values?: Partial<V>): Promise<DeleteResult>

  public abstract insert<V, R = number> (query: string, values?: Partial<V>, key?: string): Promise<Array<InsertResult<R>>>

  public abstract insertOne <V, R = number> (query: string, values?: Partial<V>, key?: string): Promise<InsertResult<R>>

  public abstract query<V, R> (query: string, values?: Partial<V>): Promise<R>

  public abstract release (): void

  public abstract select <V, R> (query: string, values?: Partial<V>): Promise<R>

  public abstract selectOne <V, R> (query: string, values?: Partial<V>): Promise<R | undefined>

  public abstract stream <V> (query: string, values?: Partial<V>): Readable

  public abstract update <V> (query: string, values?: Partial<V>): Promise<UpdateResult>

  protected abstract transformKey (key: string, index: number, value: unknown): string

  protected abstract transformObject (value: unknown): unknown
}
