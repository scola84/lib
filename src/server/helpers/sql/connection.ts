import { Query } from './query'
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
  public abstract format: (rawQuery: string, rawValues: Record<string, unknown>) => string

  public abstract tokens: tokens

  public async depopulate (entities: Record<string, Array<Partial<unknown>>>): Promise<Record<string, Array<Partial<DeleteResult>>>> {
    await Promise.all(Object
      .keys(entities)
      .map(async (table) => {
        return Promise.all(entities[table].map(async (object, index) => {
          entities[table][index] = await this.delete(new Query(table, object).delete(), object)
        }))
      }))

    return entities
  }

  public async populate<R = number>(entities: Record<string, Array<Partial<unknown>>>): Promise<Record<string, Array<Partial<InsertResult<R>>>>> {
    await Promise.all(Object
      .keys(entities)
      .map(async (table) => {
        return Promise.all(entities[table].map(async (object, index) => {
          entities[table][index] = await this.insert<unknown, R>(new Query(table, object).insert(), object)
        }))
      }))

    return entities
  }

  public abstract delete<V>(query: string, values?: Partial<V>): Promise<DeleteResult>

  public abstract insert<V, R = number>(query: string, values?: Partial<V>, key?: string): Promise<InsertResult<R>>

  public abstract insertAll<V, R = number>(query: string, values?: Partial<V>, key?: string): Promise<Array<InsertResult<R>>>

  public abstract insertOne<V, R = number>(query: string, values?: Partial<V>, key?: string): Promise<InsertResult<R>>

  public abstract query<V, R>(query: string, values?: Partial<V>): Promise<R>

  public abstract release (): void

  public abstract select<V, R>(query: string, values?: Partial<V>): Promise<R | undefined>

  public abstract selectAll<V, R>(query: string, values?: Partial<V>): Promise<R[]>

  public abstract selectOne<V, R>(query: string, values?: Partial<V>): Promise<R>

  public abstract stream<V>(query: string, values?: Partial<V>): Readable

  public abstract update<V>(query: string, values?: Partial<V>): Promise<UpdateResult>
}
