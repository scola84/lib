import type { Struct } from './is-struct'
import { isStruct } from './is-struct'

export interface Query extends Struct {
  cursor?: string
  direction?: string
  limit: number
  offset?: number
  order?: string
  search?: string
}

export function isQuery (value: unknown): value is Query {
  return (
    isStruct(value) &&
    value.limit !== undefined
  )
}
