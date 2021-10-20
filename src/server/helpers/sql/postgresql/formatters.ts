import { isArray, isDate, isNil, isObject, isPrimitive } from '../../../../common'
import { literal } from 'pg-format'

function identifier (value: string): string {
  return `"${value.replace(/\./gu, '"."')}"`
}

function parameter (value: unknown): string {
  if ((
    isArray(value) ||
    isDate(value) ||
    isNil(value) ||
    isObject(value) ||
    isPrimitive(value)
  ) && (
    typeof value !== 'symbol'
  )) {
    return literal(value)
  }

  return String(value)
}

export const formatters = {
  identifier,
  parameter
}
