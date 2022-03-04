import type { SchemaField } from '../schema'
import type { Struct } from '../../../common'

export abstract class Formatter {
  /**
   * Formats a query to a dialect-specific form.
   *
   * Delimits identifiers. An identifier should be written as $[name].
   *
   * Replaces parameters with the given values. Stringifies and delimits the parameter when possible. A parameter should be written as `$(name)`.
   *
   * @param query - The query
   * @param values - The values
   * @returns The formatted query
   * @throws a parameter from the query is not found in the values object
   *
   * @example
   * ```ts
   * const query = formatter.formatQuery(sql`
   *   SELECT *
   *   FROM t1
   *   WHERE $[c1] = $(c1)
   * `, {
   *   c1: 'v1'
   * })
   *
   * console.log(query) // query = 'SELECT * FROM t1 WHERE `c1` = "v1"' in MySQL
   * ```
   *
   * @example
   * ```ts
   * const query = formatter.formatQuery(sql`
   *   INSERT
   *   INTO t1 ($[c1])
   *   VALUES $(values)
   * `, {
   *   values: [
   *     ['v1'],
   *     ['v2']
   *   ]
   * })
   *
   * console.log(query) // query = 'INSERT INTO t1 (`c1`) VALUES ("v1"), ("v2")' in MySQL
   * ```
   */
  public formatQuery (query: string, values: Struct = {}): string {
    return (query.match(/\$[([][\w\s.]+[\])]/gu) ?? []).reduce((result, match) => {
      const key = match.slice(2, -1)

      if (match[1] === '[') {
        return result.replace(match, this.formatIdentifier(key))
      }

      const value = values[key]

      if (value === undefined) {
        throw new Error(`Parameter "${key}" is undefined`)
      }

      return result.replace(match, this.formatParameter(value))
    }, query)
  }

  public abstract formatDdl (name: string, fields: Struct<SchemaField>): string

  public abstract formatIdentifier (value: string): string

  public abstract formatLimit (query: { count?: number, cursor?: string, offset?: number }): {
    limit: string
    order: string | null
    values: Struct
    where: string | null
  }

  public abstract formatParameter (value: unknown): string

  public abstract formatSearch (query: {search?: string}, columns: string[], locale?: string): {
    where: string | null
    values: Struct
  }

  public abstract formatSort (query: { sortKey?: string, sortOrder?: string}): {
    order: string
  }
}
