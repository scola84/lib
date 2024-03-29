import { format } from '../../../common'

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
   * The language-specific collections of strings.
   *
   * @defaultValue `{}`
   */
  public static strings: Partial<Record<string, Record<string, string>>> = {}

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
  public format (code: string, language = Formatter.lang, data?: Record<string, unknown>): string {
    return format(Formatter.strings, code, language, data)
  }

  /**
   * Looks up the code of the string in the collection of strings of the given language.
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
    const strings = Formatter.strings[language] ?? {}

    const foundCode = Object
      .keys(strings)
      .find((code) => {
        return strings[code].toLowerCase() === string.toLowerCase()
      })

    return foundCode
  }
}
