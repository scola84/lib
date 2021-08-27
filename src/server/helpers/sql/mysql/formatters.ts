import { escape } from 'sqlstring'
import { isStruct } from '../../../../common'

function identifier (value: string): string {
  return `\`${value.replace(/\./gu, '`.`')}\``
}

function parameter (value: unknown): string {
  if (isStruct(value)) {
    return escape(JSON.stringify(value))
  }

  return escape(value)
}

export const formatters = {
  identifier,
  parameter
}
