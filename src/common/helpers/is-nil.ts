export type Nil = null | undefined

/**
 * Checks whether a value is null or undefined.
 *
 * @param value - The value
 * @returns Whether the value is nil
 */
export function isNil (value: unknown): value is Nil {
  return (
    value === null ||
    value === undefined
  )
}
