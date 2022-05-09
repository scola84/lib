import type { Query } from './is-query'
import { Struct } from './is-struct'
import type { User } from '../../server'
import { cast } from './cast'
import { flatten } from './flatten'
import { isNil } from './is-nil'
import { marked } from 'marked'

interface LocaleStrings {
  [key: string]: LocaleStrings | string | undefined
}

type LocaleStringsCache = Struct<I18nFormatter[] | undefined>

type Strings = Struct<Partial<Struct<string>> | undefined>

type StringsCache = Partial<Struct<LocaleStringsCache>>

export type I18nFormatter = (data: unknown) => string

export type I18nFormatterFactory = (name: string, locale: string, options: Struct<string>) => I18nFormatter

export class I18n {
  public static defaultLocale = ''

  public static formatters: Struct<I18nFormatterFactory> = {}

  public static locale = ''

  public static matcher = /\$\(.+?\)[dejnqs]/gu

  public static strings: Strings = {}

  public static stringsCache: StringsCache = {}

  public static timeZone = ''

  public static compile (string: string, locale: string): I18nFormatter[] {
    const compiled = []

    const lastString = string
      .match(I18n.matcher)
      ?.reduce((nextString, match) => {
        const index = nextString.indexOf(match)

        const [
          name,
          options = undefined
        ] = match
          .slice(2, -2)
          .split(/\?(?<options>.+)/u)

        const type = match.slice(-1)

        compiled.push(((literal: string): string => {
          return literal
        }).bind(null, nextString.slice(0, index)))

        compiled.push(I18n.formatters[type](
          name,
          locale,
          Struct.fromQuery(options ?? '')
        ))

        return nextString.slice(index + match.length)
      }, string) ?? string

    compiled.push(((literal: string): string => {
      return literal
    }).bind(null, lastString))

    return compiled
  }

  public static defineFormatters (formatters: Struct<I18nFormatterFactory>): void {
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
          .entries(flatten<string | undefined>(localeStrings))
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
          stringsCache = Struct.create<LocaleStringsCache>({})
          I18n.stringsCache[locale] = stringsCache
        }

        stringsCache[code] = I18n.compile(string ?? '', locale)
      })
  }

  public filter (items: Struct[], query: Query): Struct[] {
    const operators = flatten(query.operator ?? {})

    const where = Object
      .entries(flatten(query.where ?? {}))

    return items.filter((item) => {
      return where.every(([column, value]) => {
        const compareValue = cast(value) ?? ''
        const itemValue = cast(item[column]) ?? ''

        switch (operators[column]) {
          case 'LIKE':
            return itemValue
              .toString()
              .toLowerCase()
              .includes(compareValue
                .toString()
                .toLowerCase())
          case '>':
            return itemValue < compareValue
          case '<':
            return itemValue > compareValue
          case '>=':
            return itemValue >= compareValue
          case '<=':
            return itemValue <= compareValue
          case '<>':
            return itemValue !== compareValue
          default:
            return itemValue === compareValue
        }
      })
    })
  }

  public formatEmailAddress (user: Pick<User, 'email' | 'name'>): string {
    if (isNil(user.email)) {
      throw new Error('Email is nil')
    }

    if (isNil(user.name)) {
      return user.email
    }

    return `${user.name} <${user.email}>`
  }

  public formatMarked (code: string, data: unknown = {}, locale = I18n.locale): string {
    return marked(this.formatText(code, data, locale), {
      breaks: true,
      smartLists: true,
      smartypants: true,
      xhtml: true
    })
  }

  public formatText (code: string, data: unknown = {}, locale = I18n.locale): string {
    const string = I18n.strings[locale]?.[code] ?? I18n.strings[I18n.defaultLocale]?.[code]

    let compiled: I18nFormatter[] | undefined = []

    if (string === undefined) {
      compiled = I18n.compile(code, locale)
    } else {
      let stringsCache = I18n.stringsCache[locale]

      if (stringsCache === undefined) {
        stringsCache = Struct.create<LocaleStringsCache>({})
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
      .trim()
  }

  public sort (items: Struct[], query: Query): Struct[] {
    const order = Object
      .entries(flatten(query.order ?? {}))

    return items.sort((left, right) => {
      let equivalence = 0
      let factor = 1
      let lv = ''
      let rv = ''

      for (let direction, index = 0, key; index < order.length; index += 1) {
        [key, direction] = order[index]

        if (direction === 'DESC') {
          factor = -1
        } else {
          factor = 1
        }

        lv = String(left[key])
        rv = String(right[key])

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
}
