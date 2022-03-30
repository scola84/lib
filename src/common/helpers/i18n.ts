import type { Struct } from './is-struct'
import { cast } from './cast'
import { flatten } from './flatten'
import { isNil } from './is-nil'
import { isStruct } from './is-struct'

interface Search extends Struct {
  key?: string
  value: string
}

interface LocaleStrings {
  [key: string]: LocaleStrings | string | undefined
}

type Strings = Struct<Struct<string | undefined> | undefined>

type StringsCache = Struct<Struct<Formatter[] | undefined> | undefined>

export type Formatter = (data: unknown) => string

export type FormatterFactory = (name: string, locale: string, options: Struct<string>) => Formatter

export class I18n {
  public static formatters: Struct<FormatterFactory> = {}

  public static locale = 'en'

  public static matcher = /\$\([^)]+\)[dens]/gu

  public static strings: Strings = {}

  public static stringsCache: StringsCache = {}

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

  public static defineStrings (strings: Struct<LocaleStrings>): void {
    Object
      .entries(strings)
      .forEach(([locale, localeStrings]) => {
        Object
          .entries(flatten<string>(localeStrings))
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
        let stringsCache = I18n.stringsCache[locale]

        if (stringsCache === undefined) {
          stringsCache = {}
          I18n.stringsCache[locale] = stringsCache
        }

        stringsCache[code] = I18n.compile(string ?? '', locale)
      })
  }

  public filter (items: Struct[], search: Search[]): Struct[] {
    return items.filter((item) => {
      if (isStruct(item)) {
        return search.every(({ key, value }) => {
          return Object
            .entries(item)
            .filter(([itemKey]) => {
              return (
                key === undefined ||
                itemKey === key
              )
            })
            .map(([, itemValue]) => {
              return String(itemValue).toLowerCase()
            })
            .some((itemValue) => {
              if (
                value.startsWith('%') &&
                value.endsWith('%')
              ) {
                return itemValue.includes(value.toLowerCase())
              } else if (value.startsWith('%')) {
                return itemValue.endsWith(value.slice(1).toLowerCase())
              } else if (value.endsWith('%')) {
                return itemValue.startsWith(value.slice(0, -1).toLowerCase())
              } else if (value.startsWith('>')) {
                return (cast(itemValue) ?? 0) > (cast(value.slice(1)) ?? 0)
              } else if (value.startsWith('<')) {
                return (cast(itemValue) ?? 0) <= (cast(value.slice(1)) ?? 0)
              } else if (value.startsWith('>=')) {
                return (cast(itemValue) ?? 0) >= (cast(value.slice(2)) ?? 0)
              } else if (value.startsWith('<=')) {
                return (cast(itemValue) ?? 0) < (cast(value.slice(2)) ?? 0)
              } else if (value.startsWith('<>')) {
                return cast(itemValue) !== cast(value.slice(2))
              }

              return cast(itemValue) === cast(value)
            })
        })
      }

      return false
    })
  }

  public format (code: string, data: unknown, locale = I18n.locale): string {
    let compiled: Formatter[] | undefined = []
    let string = I18n.strings[locale]?.[code]

    if (string === undefined) {
      compiled = I18n.compile(code, locale)
      string = code
    } else {
      let stringsCache = I18n.stringsCache[locale]

      if (stringsCache === undefined) {
        stringsCache = {}
        I18n.stringsCache[locale] = stringsCache
      }

      compiled = stringsCache[code]

      if (compiled === undefined) {
        compiled = I18n.compile(string, locale)
        stringsCache[code] = compiled
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

  public sort (items: Struct[], order: string[], direction?: string[]): Struct[] {
    return items.sort((left, right) => {
      let equivalence = 0
      let factor = 1
      let key = ''
      let lv = ''
      let rv = ''

      for (let index = 0; index < order.length; index += 1) {
        key = order[index]
        lv = String(left[key])
        rv = String(right[key])

        if (direction?.[index] === 'desc') {
          factor = -1
        } else {
          factor = 1
        }

        equivalence = factor * lv.localeCompare(rv, undefined, {
          caseFirst: 'upper',
          numeric: true,
          sensitivity: 'variant'
        })

        if (equivalence !== 0) {
          return equivalence
        }
      }

      return equivalence
    })
  }

  public struct (string?: string | null, data: Struct = {}): Struct {
    if (isNil(string)) {
      return data
    }

    return this
      .format(string, data)
      .split('&')
      .reduce((params, kv) => {
        const [key, value] = kv.split('=')

        if (value === '') {
          return params
        }

        return {
          ...params,
          [key]: value
        }
      }, {})
  }
}
