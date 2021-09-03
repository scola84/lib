/**
 * Casts a value to
 *
 * * boolean — `true`, `false`, `'true'` or `'false'`
 * * number — a valid number either as a `number` or a `string`
 * * null — `null` or `'null'`
 * * undefined — `undefined` or `'undefined'`
 * * string — neither a boolean, number, null or undefined
 *
 * @param value - The value
 * @returns The result
 * @see https://stackoverflow.com/a/175787
 */
export function cast (value: unknown): boolean | number | string | null | undefined {
  if (
    value === 'true' ||
    value === true
  ) {
    return true
  } else if (
    value === 'false' ||
    value === false
  ) {
    return false
  } else if ((
    String(value).trim() !== '' &&
    !Number.isNaN(Number(value))
  ) || Number.isFinite(value)) {
    return Number(value)
  } else if (
    value === 'null' ||
    value === null
  ) {
    return null
  } else if (
    value === 'undefined' ||
    value === undefined
  ) {
    return undefined
  }

  return String(value)
}
