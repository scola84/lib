import { literal } from 'pg-format'

/**
 * Escape the value.
 *
 * Stringifies an object to JSON and an array of arrays to a bulk INSERT.
 *
 * @param value - The raw value
 * @returns The formatted value
 */
export function format (value: unknown): string {
  return literal(value as string)
}
