import type { Struct } from './is-struct'

interface Search extends Struct {
  key?: string
  value: string
}

type LocaleStrings = Struct<string | undefined>

type Strings = Struct<LocaleStrings | undefined>

type StringsCache = Struct<Struct<Formatter[] | undefined> | undefined>

export type Formatter = (data: Struct) => string

export type FormatterFactory = (name: string, locale: string, options: Struct<string>) => Formatter

export class I18n {
  public static cache: StringsCache = {}

  public static formatters: Struct<FormatterFactory> = {}

  public static locale = 'en'

  public static matcher = /\$\([^)]+\)[dens]/gu

  public static strings: Strings = {}

  public static compile (string: string, locale: string): Formatter[] {
    const compiled = []

    const lastString = string
      .match(I18n.matcher)
      ?.reduce((nextString, match) => {
        const index = nextString.indexOf(match)
        const [name, optionsString = undefined] = match.slice(2, -2).split('?')
        const type = match.slice(-1)

        compiled.push(((literal: string): string => {
          return literal
        }).bind(null, nextString.slice(0, index)))

        compiled.push(I18n.formatters[type](
          name,
          locale,
          optionsString
            ?.split('&')
            .reduce((params, kv) => {
              const [key, value] = kv.split('=')
              return {
                ...params,
                [key]: value
              }
            }, {}) ?? {}
        ))

        return nextString.slice(index + match.length)
      }, string) ?? string

    compiled.push(((literal: string): string => {
      return literal
    }).bind(null, lastString))

    return compiled
  }

  public static defineFormatters (formatters: Struct<FormatterFactory>): void {
    Object
      .entries(formatters)
      .forEach(([name, formatter]) => {
        I18n.formatters[name] = formatter
      })
  }

  public static defineStrings (strings: Strings): void {
    Object
      .entries(strings)
      .forEach(([locale, localeStrings]) => {
        Object
          .entries(localeStrings ?? {})
          .forEach(([code, string]) => {
            I18n.strings[locale] = {
              ...I18n.strings[locale],
              [code]: string
            }
          })
      })
  }

  public static precompile (locale = I18n.locale): void {
    Object
      .entries(I18n.strings[locale] ?? {})
      .forEach(([code, string]) => {
        let localeCache = I18n.cache[locale]

        if (localeCache === undefined) {
          localeCache = {}
          I18n.cache[locale] = localeCache
        }

        localeCache[code] = I18n.compile(string ?? '', locale)
      })
  }

  public format (code: string, data: Struct, locale = I18n.locale): string {
    let compiled: Formatter[] | undefined = []
    let string = I18n.strings[locale]?.[code]

    if (string === undefined) {
      compiled = I18n.compile(code, locale)
      string = code
    } else {
      let localeCache = I18n.cache[locale]

      if (localeCache === undefined) {
        localeCache = {}
        I18n.cache[locale] = localeCache
      }

      compiled = localeCache[code]

      if (compiled === undefined) {
        compiled = I18n.compile(string, locale)
        localeCache[code] = compiled
      }
    }

    return compiled
      .map((formatter) => {
        return formatter(data)
      })
      .join('')
  }

  public lookup (string: string, locale = I18n.locale): string | undefined {
    const localeStrings = I18n.strings[locale]

    if (localeStrings === undefined) {
      return undefined
    }

    return Object
      .entries(localeStrings)
      .find(([, value]) => {
        return value === string.toLowerCase()
      })
      ?.shift()
  }

  public parse (string: string, locale = I18n.locale): Search[] {
    return string
      .match(/(?:[^\s"]+|"[^"]*")+/gu)
      ?.map((match) => {
        const [
          key,
          value
        ] = match.match(/(?:[^:"]+|"[^"]*")+/gu) ?? []

        if (typeof value === 'string') {
          return {
            key: this.lookup(key.replace(/"/gu, ''), locale) ?? key,
            value: value.replace(/"/gu, '')
          }
        }

        return {
          value: key.replace(/"/gu, '')
        }
      }) ?? []
  }
}
