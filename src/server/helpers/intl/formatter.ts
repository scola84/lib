import type { Query, Struct } from '../../../common'
import { format, lookup, parse } from '../../../common'

/**
 * Defines language-specific collections of strings once and manages them throughout the application.
 */
export class Formatter {
  /**
   * The default language.
   *
   * @defaultValue 'en'
   */
  public static lang = 'en'

  /**
   * The language-specific collection of strings.
   *
   * @defaultValue `{}`
   */
  public static strings: Partial<Struct<Struct<string>>> = {}

  /**
   * Formats a string according to Intl MessageFormat.
   *
   * Uses the first argument as the code to resolve the string from the collection of strings of the given language.
   *
   * Uses the first argument directly as the string to be formatted if the code cannot be found.
   *
   * The string may contain parameters written as `{name}`, which will be replaced by the value found in the data. See the documentation (https://formatjs.io/docs/intl-messageformat) for more elaborate examples, e.g. to format plurals or dates.
   *
   * @param code - The code of the string or the string to be formatted
   * @param language - The language of the string
   * @param data - The data to format parameters inside the string
   * @throws any Intl MessageFormat error
   * @returns The formatted string
   *
   * @example
   * ```ts
   * Formatter.strings = {
   *   en: {
   *     hello: 'Hello {name}'
   *   }
   * }
   *
   * const formatter = new Formatter()
   *
   * const string = formatter.format('hello', 'en', {
   *   name: 'world'
   * })
   *
   * console.log(string) // string = 'Hello world'
   * ```
   */
  public format (code: string, language = Formatter.lang, data?: Struct): string {
    return format(Formatter.strings, code, language, data)
  }

  /**
   * Looks up the code of the string.
   *
   * @param string - The string
   * @param language - The language of the string
   * @returns The code or `undefined` if the string was not found
   *
   * @example
   * ```ts
   * Formatter.strings = {
   *   en: {
   *     hello: 'Hello {name}'
   *   }
   * }
   *
   * const formatter = new Formatter()
   * const code = formatter.lookup('Hello {name}', 'en')
   *
   * console.log(code) // code = 'hello'
   * ```
   */
  public lookup (string: string, language = Formatter.lang): string | undefined {
    return lookup(Formatter.strings, string, language)
  }

  /**
   * Parses a string into an array of queries.
   *
   * @param string - The string
   * @param language - The language of the string
   * @returns The queries
   *
   * @example
   * ```ts
   * Formatter.strings = {
   *   en: {
   *     spaced_name: 'Spaced Name'
   *   }
   * }
   *
   * const formatter = new Formatter()
   * const queries = formatter.parse('"Spaced Name":"Spaced Value" regular', 'en')
   *
   * console.log(queries)
   *
   * // queries = [{
   * //   name: 'spaced_name',
   * //   value: 'Spaced Value'
   * // }, {
   * //   value: 'regular'
   * // }]
   * ```
   */
  public parse (string: string, language = Formatter.lang): Query[] {
    return parse(Formatter.strings, string, language)
  }
}
