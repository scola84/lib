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

  public format (rawQuery: string, rawValues: Record<string, unknown> = {}): string {
    const matches = rawQuery.match(/\$\(\w+\)/gu) ?? []

    let key = null
    let query = rawQuery
    let value = null

    for (const match of matches) {
      key = match.slice(2, -1)
      value = rawValues[key]

      if (value === undefined) {
        throw new Error(`Parameter "${key}" is undefined`)
      }

      query = query.replace(match, this.formatValue(value))
    }

    return query
  }

  public abstract delete <V> (query: string, values?: Partial<V>): Promise<DeleteResult>

  public abstract formatValue (value: unknown): string

  public abstract insert<V, R = number> (query: string, values?: Partial<V>, key?: string): Promise<Array<InsertResult<R>>>

  public abstract insertOne <V, R = number> (query: string, values?: Partial<V>, key?: string): Promise<InsertResult<R>>

  public abstract query<V, R> (query: string, values?: Partial<V>): Promise<R>

  public abstract release (): void

  public abstract select <V, R> (query: string, values?: Partial<V>): Promise<R>

  public abstract selectOne <V, R> (query: string, values?: Partial<V>): Promise<R | undefined>

  public abstract stream <V> (query: string, values?: Partial<V>): Readable

  public abstract update <V> (query: string, values?: Partial<V>): Promise<UpdateResult>
}
