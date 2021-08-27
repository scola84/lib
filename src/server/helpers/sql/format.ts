import type { Struct } from '../../../common'

interface formatters {
  /**
   * Formats an identifier.
   *
   * @param identifier - The identifier
   * @returns The formatted identifier
   */
  identifier: (identifier: string) => string

  /**
   * Formats a parameter.
   *
   * @param parameter - The parameter
   * @returns The formatted parameter
   */
  parameter: (parameter: unknown) => string
}

/**
 * Creates a function to format a query.
 *
 * The formatting function accepts two arguments: the first argument should be a query as a string, the second argument may be an object with key/value pairs.
 *
 * The formatting function delimits identifiers. An identifier should be written as $[name].
 *
 * The formatting function replaces parameters with the given values. It stringifies and delimits the parameter when possible. A parameter should be written as `$(name)`.
 *
 * The formatting function throws an error if the value of a parameter is undefined.
 *
 * @param formatters - Dialect-specific functions to format identifiers and parameters
 * @returns A formatting function
 */
export function format (formatters: formatters) {
  return (query: string, values: Struct = {}): string => {
    return (query.match(/\$[([][\w\s.]+[\])]/gu) ?? []).reduce((result, match) => {
      const key = match.slice(2, -1)

      if (match[1] === '[') {
        return result.replace(match, formatters.identifier(key))
      }

      const value = values[key]

      if (value === undefined) {
        throw new Error(`Parameter "${key}" is undefined`)
      }

      return result.replace(match, formatters.parameter(value))
    }, query)
  }
}
