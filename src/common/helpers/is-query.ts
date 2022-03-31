import type { Struct } from './is-struct'
import { isStruct } from './is-struct'

export interface Query extends Struct {
  join?: Struct<Struct<number | string | undefined> | undefined>
  limit: {
    count: number
    cursor?: string
    offset?: number
  }
  operator?: Struct<Struct<string | undefined> | undefined>
  order?: {
    column?: Struct<string[] | undefined>
    direction?: string[]
  }
  select?: Struct<string[] | undefined>
  where?: Struct<Struct<number | string | undefined> | undefined>
}

export function isQuery (value: unknown): value is Query {
  return (
    isStruct(value) &&
    isStruct(value.limit) &&
    typeof value.limit.count === 'number'
  )
}
