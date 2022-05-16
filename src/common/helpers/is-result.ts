import type { Struct } from './is-struct'
import { isObject } from './is-object'

export interface Result extends Struct {
  code: string
  data?: unknown
}

export function isResult (value: unknown): value is Result {
  return (
    isObject(value)
  ) && (
    typeof value.code === 'string' &&
    value.code.startsWith('ok_')
  )
}
