import { escape } from 'sqlstring'
import { isObject } from '../../../../common'

/**
 * Escape the value.
 *
 * Stringifies an object to JSON and an array of arrays to a bulk INSERT.
 *
 * @param value - The raw value
 * @returns The formatted value
 */
export function format (value: unknown): string {
  if (
    isObject(value) ||
    typeof value === 'boolean'
  ) {
    return escape(JSON.stringify(value))
  }

  return escape(value)
}
