import type { Struct } from './is-struct'
import { isStruct } from './is-struct'

export interface Query extends Struct {
  cursor?: number | string
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
    isStruct(value)
  ) && (
    value.cursor === undefined ||
    typeof value.cursor === 'string'
  ) && (
    value.join === undefined ||
    isStruct(value.join)
  ) && (
    value.limit === undefined ||
    typeof value.limit === 'number'
  ) && (
    value.offset === undefined ||
    typeof value.offset === 'number'
  ) && (
    value.operator === undefined ||
    isStruct(value.operator)
  ) && (
    value.order === undefined ||
    isStruct(value.order)
  ) && (
    value.select === undefined ||
    isStruct(value.select)
  ) && (
    value.where === undefined ||
    isStruct(value.where)
  )
}
