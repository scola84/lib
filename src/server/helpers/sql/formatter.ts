import type { Query, QueryClauses, QueryKeys } from './query'
import type { SchemaField, SchemaFieldKey } from '../schema'
import { I18n } from '../../../common'
import type { Struct } from '../../../common'

export abstract class Formatter {
  public I18n = new I18n()

  public formatClauses (object: string, query: Query, keys: QueryKeys): Required<QueryClauses> {
    const formatKey = keys.foreign?.find((key) => {
      return query[key.column] !== undefined
    }) ?? keys.link?.find((key) => {
      return query[key.column] !== undefined
    })

    const searchKeys = keys.search?.filter((key) => {
      return (
        key.table === `'${object}'` ||
        key.table === formatKey?.table
      )
    })

    const sortKeys = keys.sort?.filter((key) => {
      return (
        key.table === `'${object}'` ||
        key.table === formatKey?.table
      )
    })

    return this.formatClausesByKey(
      object,
      this.formatJoinForeignKeys(query, keys.foreign ?? []),
      this.formatJoinLinkKeys(query, keys.link ?? []),
      this.formatLimit(query),
      this.formatSearchKeys(query, searchKeys ?? []),
      this.formatSortKeys(query, sortKeys ?? [])
    )
  }

  public formatClausesByKey (object: string, joinForeign: QueryClauses, joinLink: QueryClauses, limit: QueryClauses, search: QueryClauses, sort: QueryClauses): Required<QueryClauses> {
    return {
      join: [
        joinForeign.join,
        joinLink.join
      ].filter((value) => {
        return value !== undefined
      }).join(' '),
      limit: limit.limit ?? '',
      order: limit.order ?? sort.order ?? '1',
      select: [
        `$[${object}].*`,
        joinForeign.select
      ].filter((value) => {
        return value !== undefined
      }).join(', '),
      values: {
        ...joinForeign.values,
        ...joinLink.values,
        ...limit.values,
        ...search.values
      },
      where: [
        joinForeign.where,
        joinLink.where,
        limit.where,
        search.where
      ].filter((value) => {
        return value !== undefined
      }).join(' AND ')
    }
  }

  public formatJoinForeignKeys (query: Query, keys: SchemaFieldKey[]): QueryClauses {
    const values: Struct = {}

    let join = null
    let select = null
    let where = null

    const joinKey = keys.find((key) => {
      return query[key.column] === undefined
    })

    if (joinKey !== undefined) {
      join = `JOIN $[${joinKey.table}] USING ($[${joinKey.column}])`
      select = `$[${joinKey.table}.${joinKey.column}].*`
    }

    const whereKey = keys.find((key) => {
      return query[key.column] !== undefined
    })

    if (whereKey !== undefined) {
      values[`${whereKey.table}_${whereKey.column}`] = query[whereKey.column]
      where = `WHERE $[${whereKey.table}.${whereKey.column}] = $(${whereKey.table}_${whereKey.column})`
    }

    return {
      join: join ?? undefined,
      select: select ?? undefined,
      values,
      where: where ?? undefined
    }
  }

  public formatJoinLinkKeys (query: Query, keys: SchemaFieldKey[]): QueryClauses {
    const values: Struct = {}

    let join = null
    let where = null

    const linkKey = keys.find((key) => {
      return query[key.column] !== undefined
    })

    if (linkKey !== undefined) {
      values[`${linkKey.table}_${linkKey.column}`] = query[linkKey.column]
      join = `JOIN $[${linkKey.table}] USING ($[${linkKey.column}])`
      where = `WHERE $[${linkKey.table}.${linkKey.column}] = $(${linkKey.table}_${linkKey.column})`
    }

    return {
      join: join ?? undefined,
      values,
      where: where ?? undefined
    }
  }

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

  public formatSearchKeys (query: Query, keys: SchemaFieldKey[], locale?: string): QueryClauses {
    const values: Struct = {}

    let where: string | null = this.I18n
      .parse(String(query.search ?? ''), locale)
      .map((search, index) => {
        if (search.key === undefined) {
          return keys
            .map((key) => {
              values[`${key.table}_${key.column}_${index}`] = search.value
              return `$[${key.table}.${key.column}] = $(${key.table}_${key.column}_${index})`
            })
            .join(') OR (')
        }

        const searchKey = keys.find((key) => {
          return `${key.table}_${key.column}` === search.key
        })

        if (searchKey !== undefined) {
          values[`${searchKey.table}_${searchKey.column}`] = search.value
          return `$[${searchKey.table}.${searchKey.column}] = $(${searchKey.table}_${searchKey.column})`
        }

        return ''
      })
      .filter((part) => {
        return part !== ''
      })
      .join(') AND (')

    if (where.length > 0) {
      where = `(${where})`
    } else {
      where = null
    }

    return {
      values,
      where: where ?? undefined
    }
  }

  public formatSortKeys (query: Query, keys: SchemaFieldKey[]): QueryClauses {
    let order = null

    if (query.sortKey !== undefined) {
      const sortKey = keys.find((key) => {
        return `${key.table}_${key.column}` === query.sortKey
      })

      if (sortKey !== undefined) {
        order = `$[${sortKey.table}.${sortKey.column}] ${query.sortOrder ?? 'ASC'}`
      }
    }

    return {
      order: order ?? undefined
    }
  }

  public abstract formatDdl (name: string, fields: Struct<SchemaField>): string

  public abstract formatIdentifier (value: string): string

  public abstract formatLimit (query: Query): QueryClauses

  public abstract formatParameter (value: unknown): string
}
