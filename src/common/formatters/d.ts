import type { Formatter, Struct } from '../helpers'
import { cast } from '../helpers'
import { get } from '../helpers/get'

export function d (name: string, locale: string, options: Struct<string>): Formatter {
  const format = new Intl.DateTimeFormat(locale, options)

  const path = name
    .split('.')
    .map(cast)

  function formatter (data: unknown): string {
    const value = cast(get(data, path))?.toString() ?? 0
    return format.format(new Date(value))
  }

  return formatter
}
