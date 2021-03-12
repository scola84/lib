import type { Readable } from 'stream'
import type tokens from './tokens'

export interface DeleteResult {
  count: number
}

export interface InsertResult {
  id: number | string
}

export interface UpdateResult {
  count: number
}

export interface Connection {
  tokens: tokens

  delete: (query: string, values: unknown[]) => Promise<DeleteResult>

  insert: (query: string, values: unknown[]) => Promise<InsertResult[]>

  insertOne: (query: string, values: unknown[]) => Promise<InsertResult>

  query: <T> (query: string, values: unknown[]) => Promise<T>

  release: () => void

  select: <T>(query: string, values: unknown[]) => Promise<T>

  selectOne: <T>(query: string, values: unknown[]) => Promise<T | undefined>

  stream: (query: string, values: unknown[]) => Promise<Readable>

  update: (query: string, values: unknown[]) => Promise<UpdateResult>
}
