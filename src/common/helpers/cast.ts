/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */
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
 * @returns The cast value
 * @see https://stackoverflow.com/a/175787
 */
export function cast (value: unknown): Date | boolean | number | string | null | undefined {
  if (
    value === null ||
    value === 'null'
  ) {
    return null
  }

  if (value === '\'null\'') {
    return 'null'
  }

  if (
    value === undefined ||
    value === 'undefined'
  ) {
    return undefined
  }

  if (value === '\'undefined\'') {
    return 'undefined'
  }

  if (
    value === false ||
    value === 'false'
  ) {
    return false
  }

  if (value === '\'false\'') {
    return 'false'
  }

  if (
    value === true ||
    value === 'true'
  ) {
    return true
  }

  if (value === '\'true\'') {
    return 'true'
  }

  if (
    Number.isFinite(value) &&
    typeof value === 'number'
  ) {
    return value
  }

  if (
    !(value instanceof Date) &&
    String(value).trim() !== '' &&
    Number.isFinite(Number(value))
  ) {
    return Number(value)
  }

  if (value instanceof Date) {
    return value
  }

  if (Number.isFinite(Date.parse(String(value)))) {
    return new Date(Date.parse(String(value)))
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value)
}
