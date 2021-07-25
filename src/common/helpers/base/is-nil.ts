/**
 * Checks whether a value is null or undefined.
 *
 * @param value - The value
 * @returns The result
 */
export function isNil (value: unknown): value is null | undefined {
  return (
    value === null ||
    value === undefined
  )
}
