/**
 * Creates a function to format a query.
 *
 * The formatting function accepts two arguments: the first argument should be a query as a string, the second argument may be an object with key/value pairs.
 *
 * The formatting function replaces all parameters in the query with the given values. A parameter should be written as `$(name)`.
 *
 * The formatting function escapes all values, stringifies objects to JSON and arrays of arrays to bulk INSERTs.
 *
 * The formatting function throws an error if the value of a parameter is undefined.
 *
 * @param formatValue - A dialect-specific function to format a value
 * @returns A formatting function
 */
export function format (formatValue: (value: unknown) => string) {
  return (query: string, values: Record<string, unknown> = {}): string => {
    return (query.match(/\$\(\w+\)/gu) ?? []).reduce((result, match) => {
      const key = match.slice(2, -1)
      const value = values[key]

      if (value === undefined) {
        throw new Error(`Parameter "${key}" is undefined`)
      }

      return result.replace(match, formatValue(value))
    }, query)
  }
}
