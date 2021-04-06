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

export interface Connection {
  tokens: tokens

  delete: <V> (query: string, values: Partial<V>) => Promise<DeleteResult>

  insert: <V, R = number> (query: string, values: Partial<V>) => Promise<Array<InsertResult<R>>>

  insertOne: <V, R = number> (query: string, values: Partial<V>) => Promise<InsertResult<R>>

  query: <V, R> (query: string, values: Partial<V>) => Promise<R>

  release: () => Promise<void>

  select: <V, R> (query: string, values: Partial<V>) => Promise<R>

  selectOne: <V, R> (query: string, values: Partial<V>) => Promise<R | undefined>

  stream: <V> (query: string, values: Partial<V>) => Promise<Readable>

  update: <V> (query: string, values: Partial<V>) => Promise<UpdateResult>
}
