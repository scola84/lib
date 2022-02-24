/**
 * Casts a value to
 *
 * * null — `null` or `'null'`
 * * undefined — `undefined` or `'undefined'`
 * * boolean — `false`, `true`,  `'false'` or `'true'`
 * * number — a valid number either as a `number` or a `string`
 * * string — any of the above, quoted, e.g. `'\'false\''` is cast to 'false'
 * * string — neither a boolean, number, null or undefined
 *
 * @param value - The value
 * @returns The result
 * @see https://stackoverflow.com/a/175787
 */
export function cast (value: unknown): boolean | number | string | null | undefined {
  if (
    value === 'null' ||
    value === null
  ) {
    return null
  } else if (value === '\'null\'') {
    return 'null'
  } else if (
    value === 'undefined' ||
    value === undefined
  ) {
    return undefined
  } else if (value === '\'undefined\'') {
    return 'undefined'
  } else if (
    value === 'false' ||
    value === false
  ) {
    return false
  } else if (value === '\'false\'') {
    return 'false'
  } else if (
    value === 'true' ||
    value === true
  ) {
    return true
  } else if (value === '\'true\'') {
    return 'true'
  } else if ((
    String(value).trim() !== '' &&
    !Number.isNaN(Number(value))
  ) || Number.isFinite(value)) {
    return Number(value)
  }

  return String(value)
}
