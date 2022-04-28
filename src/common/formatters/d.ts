import type { I18nFormatter, Struct } from '../helpers'
import { cast, get } from '../helpers'

export function d (name: string, locale: string, options: Struct<string>): I18nFormatter {
  const format = new Intl.DateTimeFormat(locale, options)

  const path = name
    .split('.')
    .map(cast)
    .filter((key) => {
      return key !== ''
    })

  function formatter (data: unknown): string {
    const value = cast(get(data, path))

    if (value instanceof Date) {
      return format.format(value)
    }

    return ''
  }

  return formatter
}
