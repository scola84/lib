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
  if (typeof value === 'boolean') {
    return Boolean(value)
  } else if (Number.isFinite(value)) {
    return Number(value)
  }

  if (
    value === 'true' ||
    value === 'false'
  ) {
    return Boolean(JSON.parse(value))
  } else if (
    !isNaN(value as number) &&
    !isNaN(parseFloat(value as string))
  ) {
    return Number(value)
  }

  return String(value)
}
