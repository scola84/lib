import { escape } from 'sqlstring'
import lodash from 'lodash'

/**
 * Escape the value.
 *
 * Stringifies an object to JSON and an array of arrays to a bulk INSERT.
 *
 * @param value - The raw value
 * @returns The formatted value
 */
export function format (value: unknown): string {
  return escape(lodash.isPlainObject(value) ? JSON.stringify(value) : value)
}
