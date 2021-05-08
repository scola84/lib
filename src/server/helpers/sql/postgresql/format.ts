import { literal } from 'pg-format'

export function format (value: unknown): string {
  return literal(value as string)
}
