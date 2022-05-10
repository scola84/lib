import { I18n, cast, get, isNil } from '../helpers'
import type { I18nFormatter, Struct } from '../helpers'

export function e (name: string, locale: string, options: Partial<Struct<string>>): I18nFormatter {
  const i18n = new I18n()

  const path = name
    .split('.')
    .map(cast)
    .filter((key) => {
      return key !== ''
    })

  const defaultValue = cast(options.default)
  const counter = cast(options.counter)

  function formatter (data: unknown): string {
    if (typeof defaultValue === 'string') {
      const value = cast(get(data, path))

      if (
        isNil(value) ||
        value === ''
      ) {
        return i18n.formatText(defaultValue, data, locale)
      }

      return value.toString()
    } else if (typeof counter === 'string') {
      const value = cast(get(data, [counter])) ?? ''
      const code = `${name}_${value.toString()}`

      if (I18n.strings[locale]?.[code] === undefined) {
        return i18n.formatText(`${name}_d`, data, locale)
      }

      return i18n.formatText(code, data, locale)
    }

    return ''
  }

  return formatter
}
