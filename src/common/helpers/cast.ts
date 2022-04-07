export type CastValue = Date | boolean | number | string | null | undefined

/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */
/**
 * Casts a value to
 *
 * * Date — a valid date either as a `Date` or a `string`
 * * boolean — `false`, `true`, `'false'` or `'true'`
 * * number — a valid number either as a `number` or a `string`
 * * string — a single quoted boolean, null or undefined
 * * string — neither a boolean, date, number, null or undefined
 * * null — `null` or `'null'`
 * * undefined — `undefined` or `'undefined'`
 *
 * @param value - The value
 * @returns The cast value
 * @see https://stackoverflow.com/a/175787
 */
export function cast (value: unknown): CastValue {
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
    typeof value === 'string' &&
    value !== ''
  ) {
    const number = Number(value)

    if (Number.isFinite(number)) {
      return number
    }
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string') {
    if ((/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/iu).test(value)) {
      return new Date(value)
    }

    return value.trim()
  }

  return JSON.stringify(value)
}
