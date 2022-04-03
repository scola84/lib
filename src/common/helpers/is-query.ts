import type { Struct } from './is-struct'
import { isStruct } from './is-struct'

export interface Query extends Struct {
  cursor?: string
  join?: Struct<Struct<number | string | undefined> | undefined>
  limit?: number
  offset?: number
  operator?: Struct<Struct<string | undefined> | string | undefined>
  order?: Struct<Struct<string | undefined> | string | undefined>
  select?: Struct<Struct<boolean | undefined> | boolean | undefined>
  where?: Struct<Struct<unknown | undefined> | unknown | undefined>
}

export function isQuery (value: unknown): value is Query {
  return (
    isStruct(value) &&
    typeof value.limit === 'number'
  )
}
