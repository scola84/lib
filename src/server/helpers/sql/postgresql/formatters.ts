import { isArray, isPrimitive, isStruct } from '../../../../common'
import { literal } from 'pg-format'

function identifier (value: string): string {
  return `"${value.replace(/\./gu, '"."')}"`
}

function parameter (value: unknown): string {
  if ((
    isPrimitive(value) &&
    typeof value !== 'symbol'
  ) ||
  isArray(value) ||
  isStruct(value) ||
  value instanceof Date
  ) {
    return literal(value)
  }

  return String(value)
}

export const formatters = {
  identifier,
  parameter
}
