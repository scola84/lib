/**
 * Checks whether a value is an array.
 *
 * @param value - The value
 * @returns The result
 */
export function isArray (value: unknown): value is unknown[] {
  return Array.isArray(value)
}
