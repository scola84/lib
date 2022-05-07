import type { I18nFormatter, Struct } from '../helpers'
import { cast, get } from '../helpers'

export function d (name: string, locale: string, options: Struct<string>): I18nFormatter {
  const path = name
    .split('.')
    .map(cast)
    .filter((key) => {
      return key !== ''
    })

  function formatter (data: unknown): string {
    const timeZone = cast(get(data, `${name}_time_zone`))
    const value = cast(get(data, path))

    if (value instanceof Date) {
      return value.toLocaleString(locale, {
        ...options,
        timeZone: timeZone?.toString()
      })
    }

    return ''
  }

  return formatter
}
