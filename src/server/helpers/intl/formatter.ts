import Format from 'intl-messageformat'

/**
 * Defines language-specific collections of strings once and manages them throughout the application.
 */
export class Formatter {
  /**
   * The default language.
   */
  public static lang = 'en'

  /**
   * The language-specific collections of strings.
   */
  public static strings: Record<string, Record<string, string> | undefined> = {}

  /**
   * Formats a string according to `Intl MessageFormat`.
   *
   * Uses the first argument as a key to resolve the string from the collection of strings of the given language.
   *
   * Uses the first argument directly as the string to be formatted if the key cannot be found.
   *
   * The string may contain parameters written as `{name}`, which will be replaced by the value found in the data. See the documentation (https://formatjs.io/docs/intl-messageformat) for more elaborate examples, e.g. to format plurals or dates.
   *
   * Returns the first argument if an error occurs while formatting, e.g. if a parameter in the string is not found in the data.
   *
   * @param string - The key of the string or the string to be formatted
   * @param language - The language of the string
   * @param data - The data to format parameters inside the string
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
   * // string = 'Hello world'
   * ```
   */
  public format (string: string, language = Formatter.lang, data?: Record<string, unknown>): string {
    try {
      return String(new Format(Formatter.strings[language]?.[string] ?? string, language).format(data))
    } catch (error: unknown) {
      return string
    }
  }

  /**
   * Looks up the key of the string in the collection of strings of the given language.
   *
   * @param string - The string
   * @param language - The language of the string
   * @returns The key or `undefined` if the string was not found
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
   * const key = formatter.lookup('Hello {name}', 'en')
   *
   * // key = 'hello'
   * ```
   */
  public lookup (string: string, language = Formatter.lang): string | undefined {
    const strings = Formatter.strings[language] ?? {}

    return Object
      .keys(strings)
      .find((code) => {
        return strings[code].toLowerCase() === string.toLowerCase()
      })
  }
}
