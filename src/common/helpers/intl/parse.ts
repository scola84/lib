import type { Strings } from './strings'
import { lookup } from './lookup'

export interface Query {
  name?: string
  value: string
}

/**
 * Parses a string into an array of queries.
 *
 * @param strings - The collection of strings
 * @param string - The string
 * @param language - The language of the string
 * @returns The queries
 *
 * @example
 * ```ts
 * const strings = {
 *   en: {
 *     spaced_name: 'Spaced Name'
 *   }
 * }
 *
 * const queries = parse(strings, '"Spaced Name":"Spaced Value" regular', 'en')
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
export function parse (strings: Strings, string: string, language: string): Query[] {
  return string
    .match(/(?:[^\s"]+|"[^"]*")+/gu)
    ?.map((match) => {
      const [
        name,
        value
      ] = match.match(/(?:[^:"]+|"[^"]*")+/gu) as [string, string | undefined]

      if (value === undefined) {
        return {
          value: name.replace(/"/gu, '')
        }
      }

      return {
        name: lookup(strings, name.replace(/"/gu, ''), language) ?? name,
        value: value.replace(/"/gu, '')
      }
    }) ?? []
}
