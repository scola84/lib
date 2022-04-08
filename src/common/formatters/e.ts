import type { Formatter, Struct } from '../helpers'
import { I18n, cast, get, isNil } from '../helpers'

export function e (name: string, locale: string, options: Partial<Struct<string>>): Formatter {
  const i18n = new I18n()

  const path = name
    .split('.')
    .map(cast)
    .filter((key) => {
      return key !== ''
    })

  const def = cast(options.default)
  const counter = cast(options.counter)

  function formatter (data: unknown): string {
    if (typeof def === 'string') {
      const value = cast(get(data, path))

      if (
        isNil(value) ||
        value === ''
      ) {
        return i18n.format(def, data, locale)
      }

      return value.toString()
    } else if (typeof counter === 'string') {
      const value = cast(get(data, [counter])) ?? ''
      const code = `${name}_${value.toString()}`

      if (I18n.strings[locale]?.[code] === undefined) {
        return i18n.format(`${name}_d`, data, locale)
      }

      return i18n.format(code, data, locale)
    }

    return ''
  }

  return formatter
}
