import type { Formatter, Struct } from '../helpers'
import { cast } from '../helpers'

export function n (name: string, locale: string, options: Struct<string>): Formatter {
  const format = new Intl.NumberFormat(locale, options)

  function formatter (data: Struct): string {
    const value = cast(data[name]) ?? 0
    return format.format(Number(value))
  }

  return formatter
}
