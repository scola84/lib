import { escape } from 'sqlstring'
import { isObject } from '../../../../common'

function identifier (value: string): string {
  return `[${value.replace(/\./gu, '].[')}]`
}

function parameter (value: unknown): string {
  if (
    isObject(value) ||
    typeof value === 'boolean'
  ) {
    return escape(JSON.stringify(value))
  }

  return escape(value)
}

export const formatters = {
  identifier,
  parameter
}
