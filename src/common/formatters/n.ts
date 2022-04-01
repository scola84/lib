import type { Formatter, Struct } from '../helpers'
import { cast } from '../helpers'
import { get } from '../helpers/get'

export function n (name: string, locale: string, options: Struct<string>): Formatter {
  const format = new Intl.NumberFormat(locale, options)
  const path = name.split(/[._-]/u).map(cast)

  function formatter (data: unknown): string {
    const value = cast(get(data, path)) ?? 0
    return format.format(Number(value))
  }

  return formatter
}
