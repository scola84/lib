import type { Struct } from './is-struct'
import { isNumber } from './is-number'
import { isStruct } from './is-struct'

export interface Query extends Struct {
  cursor?: number | string
  join?: Struct<Struct<number | string | undefined> | undefined>
  limit?: number
  offset?: number
  operator?: Struct<Partial<Struct<string>> | string | undefined>
  order?: Struct<Partial<Struct<string>> | string | undefined>
  select?: Struct<Partial<Struct<boolean>> | boolean | undefined>
  where?: Struct
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
    isNumber(value.limit)
  ) && (
    value.offset === undefined ||
    isNumber(value.offset)
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
