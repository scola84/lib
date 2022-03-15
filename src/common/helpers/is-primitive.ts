export type Primitive = BigInt | boolean | number | string | symbol

/**
 * Checks whether a value is a primitive, excluding `null` and `undefined`.
 *
 * @param value - The value
 * @returns Whether the value is a primitive
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Primitive
 */
export function isPrimitive (value: unknown): value is Primitive {
  return (
    typeof value === 'bigint' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string' ||
    typeof value === 'symbol'
  )
}
