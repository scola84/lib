import type { Struct } from './is-struct'
import { isStruct } from './is-struct'

export interface Query extends Struct {
  cursor?: string
  join?: Struct<Struct<number | string | undefined> | undefined>
  limit: number
  offset?: number
  order?: string[]
  select?: string[]
  where?: Struct<string[] | Struct<string[] | string | undefined> | string | undefined>
}

export function isQuery (value: unknown): value is Query {
  return (
    isStruct(value) &&
    typeof value.limit === 'number'
  )
}
