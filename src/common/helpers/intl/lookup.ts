import type { Strings } from './strings'
import type { Struct } from '../base'

/**
 * Looks up the code of the string.
 *
 * @param strings - The collection of strings
 * @param string - The string
 * @param language - The language of the string
 * @returns The code or `undefined` if the string was not found
 *
 * @example
 * ```ts
 * const strings = {
 *   en: {
 *     hello: 'Hello {name}'
 *   }
 * }
 *
 * const code = lookup(strings, 'Hello {name}', 'en')
 *
 * console.log(code) // code = 'hello'
 * ```
 */
export function lookup (strings: Strings, string: string, language: string): string | undefined {
  const languageStrings = strings[language] as Struct<string> | undefined

  if (languageStrings === undefined) {
    return undefined
  }

  return Object
    .keys(languageStrings)
    .find((code) => {
      return languageStrings[code].toLowerCase() === string.toLowerCase()
    })
}
