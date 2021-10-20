import Format from 'intl-messageformat'
import type { Strings } from './strings'
import type { Struct } from '../type'

/**
 * Formats a string according to Intl MessageFormat.
 *
 * Uses the first argument as the code to resolve the string from the collection of strings of the given language.
 *
 * Uses the first argument directly as the string to be formatted if the code cannot be found.
 *
 * The string may contain parameters written as `{name}`, which will be replaced by the value found in the data. See the documentation (https://formatjs.io/docs/intl-messageformat) for more elaborate examples, e.g. to format plurals or dates.
 *
 * @param strings - The collection of strings
 * @param code - The code of the string or the string to be formatted
 * @param language - The language of the string
 * @param data - The data to format parameters inside the string
 * @throws any Intl MessageFormat error
 * @returns The formatted string
 *
 * @example
 * ```ts
 * const strings = {
 *   en: {
 *     hello: 'Hello {name}'
 *   }
 * }
 *
 * const string = format(strings, 'hello', 'en', {
 *   name: 'world'
 * })
 *
 * console.log(string) // string = 'Hello world'
 * ```
 */
export function format (strings: Strings, code: string, language: string, data?: Struct): string {
  const languageStrings = strings[language]

  if (languageStrings === undefined) {
    return code
  }

  let string = languageStrings[code]

  if (string === undefined) {
    string = code
  }

  const formattedString = new Format(string, language).format(data)

  if (typeof formattedString === 'string') {
    return formattedString
  }

  return string
}
