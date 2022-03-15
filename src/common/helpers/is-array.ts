/**
 * Checks whether a value is an array.
 *
 * @param value - The value
 * @returns Whether the value is an array
 */
export function isArray (value: unknown): value is unknown[] {
  return Array.isArray(value)
}
