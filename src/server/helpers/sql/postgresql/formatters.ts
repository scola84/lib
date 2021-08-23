import { literal } from 'pg-format'

function identifier (value: string): string {
  return `"${value.replace(/\./gu, '"."')}"`
}

function parameter (value: unknown): string {
  return literal(value as string)
}

export const formatters = {
  identifier,
  parameter
}
