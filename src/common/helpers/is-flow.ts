import type { Struct } from './is-struct'
import { isObject } from './is-object'
import { isStruct } from './is-struct'

export interface Flow extends Struct {
  data?: unknown
  next: string
}

export function isFlow (value: unknown): value is Flow {
  return (
    isObject(value)
  ) && (
    typeof value.next === 'string'
  ) && (
    value.data === undefined ||
    isStruct(value.data)
  )
}
