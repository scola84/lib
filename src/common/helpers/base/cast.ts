/**
 * Casts a value to
 *
 * * boolean — `true`, `false`, `'true'` or `'false'`
 * * number — a valid number either as a `number` or a `string`
 * * string — neither a boolean nor a number
 *
 * @param value - The value
 * @returns The result
 * @see https://stackoverflow.com/a/175787
 */
export function cast (value: unknown): boolean | number | string {
  if (
    value === true ||
    value === 'true'
  ) {
    return true
  } else if (
    value === false ||
    value === 'false'
  ) {
    return false
  } else if (
    Number.isFinite(value) ||
    !isNaN(parseFloat(String(value)))
  ) {
    return Number(value)
  }

  return String(value)
}
