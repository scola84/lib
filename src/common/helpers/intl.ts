import type { Struct } from './is-struct'

interface Query extends Struct {
  name?: string
  value: string
}

type Factory = Struct<(name: string, locale: string, options: Struct<string>) => Formatter>

type Formatter = (data: Struct) => string

type Strings = Struct<Struct<string | undefined> | undefined>

type StringsCache = Struct<Struct<Formatter[] | undefined> | undefined>

export class ScolaIntl {
  public static cache: StringsCache = {}

  public static factory: Factory = {
    date: (name: string, locale: string, options: Struct<string>) => {
      const formatter = new Intl.DateTimeFormat(locale, options)
      return (data: Struct): string => {
        return formatter.format(new Date(String(data[name])))
      }
    },
    enum: (name: string, locale: string) => {
      const formatter = new ScolaIntl()
      return (data: Struct): string => {
        if (ScolaIntl.strings[locale]?.[`${name}_${String(data[name])}`] === undefined) {
          return formatter.format(`${name}_d`, data, locale)
        }

        return formatter.format(`${name}_${String(data[name])}`, data, locale)
      }
    },
    number: (name: string, locale: string, options: Struct<string>) => {
      const formatter = new Intl.NumberFormat(locale, options)
      return (data: Struct): string => {
        return formatter.format(Number(data[name] ?? 0))
      }
    },
    string: (name: string) => {
      return (data: Struct): string => {
        return String(data[name] ?? '')
      }
    }
  }

  public static locale = 'en'

  public static strings: Strings = {}

  public static compile (string: string, locale: string): Formatter[] {
    const compiled = []

    const lastString = string
      .match(/(?<var>:(?<name>[\w:?&=]+))/gu)
      ?.reduce((nextString, match) => {
        const index = nextString.indexOf(match)
        const [, name, uri = 'string'] = match.split(/:+/u)
        const [host, query = ''] = uri.split('?')

        compiled.push(
          ((literal: string): string => {
            return literal
          }).bind(null, nextString.slice(0, index)),
          ScolaIntl.factory[host](
            name,
            locale,
            query
              .split('&')
              .reduce((params, kvp) => {
                const [key, value] = kvp.split('=')
                return {
                  ...params,
                  [key]: value
                }
              }, {})
          )
        )

        return nextString.slice(index + match.length)
      }, string) ?? string

    compiled.push(((literal: string): string => {
      return literal
    }).bind(null, lastString))

    return compiled
  }

  public static define (locale: string, strings: Struct<string>): void {
    if (ScolaIntl.strings[locale] === undefined) {
      ScolaIntl.strings[locale] = strings
    } else {
      Object.assign(ScolaIntl.strings[locale], strings)
    }
  }

  public static defineStrings (strings: Strings): void {
    ScolaIntl.strings = strings
  }

  public static precompile (locale = ScolaIntl.locale): void {
    Object
      .entries(ScolaIntl.strings[locale] ?? {})
      .forEach(([code, string]) => {
        let localeCache = ScolaIntl.cache[locale]

        if (localeCache === undefined) {
          localeCache = {}
          ScolaIntl.cache[locale] = localeCache
        }

        localeCache[code] = ScolaIntl.compile(string ?? '', locale)
      })
  }

  public format (code: string, data: Struct, locale = ScolaIntl.locale): string {
    let compiled: Formatter[] | undefined = []
    let string = ScolaIntl.strings[locale]?.[code]

    if (string === undefined) {
      compiled = ScolaIntl.compile(code, locale)
      string = code
    } else {
      let localeCache = ScolaIntl.cache[locale]

      if (localeCache === undefined) {
        localeCache = {}
        ScolaIntl.cache[locale] = localeCache
      }

      compiled = localeCache[code]

      if (compiled === undefined) {
        compiled = ScolaIntl.compile(string, locale)
        localeCache[code] = compiled
      }
    }

    return compiled.map((formatter) => {
      return formatter(data)
    }).join('')
  }

  public lookup (string: string, locale = ScolaIntl.locale): string | undefined {
    const localeStrings = ScolaIntl.strings[locale]

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

  public parse (string: string, locale = ScolaIntl.locale): Query[] {
    return string
      .match(/(?:[^\s"]+|"[^"]*")+/gu)
      ?.map((match) => {
        const [
          name,
          value
        ] = match.match(/(?:[^:"]+|"[^"]*")+/gu) ?? []

        if (typeof value === 'string') {
          return {
            name: this.lookup(name.replace(/"/gu, ''), locale) ?? name,
            value: value.replace(/"/gu, '')
          }
        }

        return {
          value: name.replace(/"/gu, '')
        }
      }) ?? []
  }
}
