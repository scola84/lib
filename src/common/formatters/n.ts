import type { Formatter, Struct } from '../helpers'
import { cast, get, isNumber } from '../helpers'

export function n (name: string, locale: string, options: Struct<string>): Formatter {
  const format = new Intl.NumberFormat(locale, options)

  const path = name
    .split('.')
    .map(cast)

  function formatter (data: unknown): string {
    const value = cast(get(data, path))

    if (isNumber(value)) {
      return format.format(value)
    }

    return ''
  }

  return formatter
}
