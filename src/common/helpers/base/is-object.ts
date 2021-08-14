/**
 * Checks whether a value is a plain object.
 *
 * @param value - The value
 * @returns The result
 * @see https://stackoverflow.com/a/8511350
 */
export function isObject (value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value !== null
  )
}