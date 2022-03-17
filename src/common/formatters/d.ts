import type { Formatter, Struct } from '../helpers'
import { cast } from '../helpers'

export function d (name: string, locale: string, options: Struct<string>): Formatter {
  const format = new Intl.DateTimeFormat(locale, options)

  function formatter (data: Struct): string {
    const value = cast(data[name])?.toString() ?? 0
    return format.format(new Date(value))
  }

  return formatter
}
