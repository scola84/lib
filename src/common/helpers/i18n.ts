import type { Struct } from './is-struct'

interface Search extends Struct {
  key?: string
  value: string
}

type Factory = Struct<(name: string, locale: string, options: Struct<string>) => Formatter>

type Formatter = (data: Struct) => string

type Strings = Struct<Struct<string | undefined> | undefined>

type StringsCache = Struct<Struct<Formatter[] | undefined> | undefined>

export class I18n {
  public static cache: StringsCache = {}

  public static factory: Factory = {
    d: (name: string, locale: string, options: Struct<string>) => {
      const formatter = new Intl.DateTimeFormat(locale, options)
      return (data: Struct): string => {
        return formatter.format(new Date(String(data[name] ?? new Date(0))))
      }
    },
    e: (name: string, locale: string, options: Struct<string>) => {
      const formatter = new I18n()
      return (data: Struct): string => {
        if (I18n.strings[locale]?.[`${name}_${String(data[options.counter])}`] === undefined) {
          return formatter.format(`${name}_d`, data, locale)
        }

        return formatter.format(`${name}_${String(data[options.counter])}`, data, locale)
      }
    },
    n: (name: string, locale: string, options: Struct<string>) => {
      const formatter = new Intl.NumberFormat(locale, options)
      return (data: Struct): string => {
        return formatter.format(Number(data[name] ?? 0))
      }
    },
    s: (name: string) => {
      return (data: Struct): string => {
        return String(data[name] ?? '')
      }
    }
  }

  public static locale = 'en'

  public static matcher = /%\([^)]+\)[dens]/gu

  public static strings: Strings = {}

  public static compile (string: string, locale: string): Formatter[] {
    const compiled = []

    const lastString = I18n.matcher
      .exec(string)
      ?.reduce((nextString, match) => {
        const index = nextString.indexOf(match)
        const [name, optionsString = undefined] = match.slice(2, -2).split('?')
        const type = match.slice(-1)

        compiled.push(((literal: string): string => {
          return literal
        }).bind(null, nextString.slice(0, index)))

        compiled.push(I18n.factory[type](
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

  public static define (locale: string, strings: Struct<string>): void {
    if (I18n.strings[locale] === undefined) {
      I18n.strings[locale] = strings
    } else {
      Object.assign(I18n.strings[locale], strings)
    }
  }

  public static defineStrings (strings: Strings): void {
    I18n.strings = strings
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
