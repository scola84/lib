import type { Query, QueryKeys, QueryOutput, QueryParts } from './query'
import type { SchemaField, SchemaFieldKey } from '../schema'
import { I18n } from '../../../common'
import type { Struct } from '../../../common'
import type { User } from '../../entities'

export abstract class Formatter {
  public I18n = new I18n()

  public createSelect (object: string, keys: QueryKeys, authKeys: SchemaFieldKey[], query: Query, user?: User): QueryOutput {
    if (authKeys.length === 0) {
      throw new Error('Auth keys are undefined')
    }

    const auth = this.createAuthParts(keys, authKeys, user)

    if (
      auth.parts === undefined ||
      auth.parts.length === 0
    ) {
      throw new Error('Auth is undefined')
    }

    const select = this.createSelectParts(query, keys)

    if (select.where === undefined) {
      throw new Error('Where is undefined')
    }

    const queries = auth.parts.map((authPart) => {
      if (authPart.where === undefined) {
        throw new Error('Where is undefined')
      }

      return `
        SELECT [${object}].*
        FROM $[${object}]
        ${authPart.join ?? ''}
        WHERE ${[
          select.where,
          authPart.where
        ].join(' AND ')}
      `
    })

    return {
      query: queries.join(' UNION '),
      values: {
        ...select.values,
        ...auth.values
      }
    }
  }

  public createSelectAll (object: string, keys: QueryKeys, authKeys: SchemaFieldKey[], query: Query, user?: User): QueryOutput {
    if (authKeys.length === 0) {
      throw new Error('Auth keys are undefined')
    }

    const auth = this.createAuthParts(keys, authKeys, user)

    if (
      auth.parts === undefined ||
      auth.parts.length === 0
    ) {
      throw new Error('Auth is undefined')
    }

    const selectAll = this.createSelectAllParts(object, query, keys)

    const queries = auth.parts.map((authPart) => {
      if (authPart.where === undefined) {
        throw new Error('Where is undefined')
      }

      return `
        SELECT ${selectAll.select ?? `$[${object}].*`}
        FROM $[${object}]
        ${selectAll.join ?? ''}
        ${authPart.join ?? ''}
        WHERE ${[
          selectAll.where,
          authPart.where
        ].filter((value) => {
          return value !== undefined
        }).join(' AND ')}
      `
    })

    return {
      query: `
        ${queries.join(' UNION ')}
        ORDER BY ${selectAll.order ?? '1'}
        ${selectAll.limit ?? ''}
      `,
      values: {
        ...selectAll.values,
        ...auth.values
      }
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

  protected createAuthParts (keys: QueryKeys, authKeys: SchemaFieldKey[], user?: User): QueryParts {
    const values: Struct = {}

    const parts = authKeys
      .map((authKey) => {
        return keys.auth?.[authKey.table]?.map((joinKeys) => {
          const join: string[] = []

          let where = null
          let lastKey = authKey

          joinKeys.forEach((key) => {
            join.push(`JOIN $[${key.table}] ON $[${lastKey.table}.${lastKey.column}] = $[${key.table}.${lastKey.column}]`)
            lastKey = key
          })

          if (
            lastKey.column === 'group_id' ||
            lastKey.column === 'user_id'
          ) {
            values[`${lastKey.table}_${lastKey.column}`] = user?.[lastKey.column] ?? 0
            where = `$[${lastKey.table}.${lastKey.column}] = $(${lastKey.table}_${lastKey.column})`
          }

          return {
            join: join.join(' '),
            where: where ?? undefined
          }
        }) ?? []
      })
      .flat()

    return {
      parts,
      values
    }
  }

  protected createSelectAllParts (object: string, query: Query, keys: QueryKeys): QueryParts {
    const filterKey = keys.foreign?.find((key) => {
      return query[key.column] === undefined
    }) ?? keys.link?.find((key) => {
      return query[key.column] === undefined
    })

    const searchKeys = keys.search?.filter((key) => {
      return (
        key.table === `'${object}'` ||
        key.table === filterKey?.table
      )
    })

    const sortKeys = keys.sort?.filter((key) => {
      return (
        key.table === `'${object}'` ||
        key.table === filterKey?.table
      )
    })

    return this.createSelectAllPartsByKey(
      object,
      this.createSelectAllPartsForeignKeys(query, keys.foreign ?? []),
      this.createSelectAllPartsLinkKeys(query, keys.link ?? []),
      this.createSelectAllPartsSearchKeys(query, searchKeys ?? []),
      this.createSelectAllPartsSortKeys(query, sortKeys ?? []),
      this.createSelectAllPartsLimit(query)
    )
  }

  protected createSelectAllPartsByKey (object: string, foreignParts: QueryParts, linkParts: QueryParts, searchParts: QueryParts, sortParts: QueryParts, limitParts: QueryParts): QueryParts {
    const join = [
      foreignParts.join,
      linkParts.join
    ].filter((value) => {
      return value !== undefined
    }).join(' ')

    const { limit } = limitParts
    const order = limitParts.order ?? sortParts.order ?? '1'
    const parts: QueryParts[] = []

    const select = [
      `$[${object}].*`,
      foreignParts.select
    ].filter((value) => {
      return value !== undefined
    }).join(', ')

    const values = {
      ...foreignParts.values,
      ...linkParts.values,
      ...limitParts.values,
      ...searchParts.values
    }

    const where = [
      foreignParts.where,
      linkParts.where,
      limitParts.where,
      searchParts.where
    ].filter((value) => {
      return value !== undefined
    }).join(' AND ')

    return {
      join,
      limit,
      order,
      parts,
      select,
      values,
      where
    }
  }

  protected createSelectAllPartsForeignKeys (query: Query, keys: SchemaFieldKey[]): QueryParts {
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
      where = `$[${whereKey.table}.${whereKey.column}] = $(${whereKey.table}_${whereKey.column})`
    }

    return {
      join: join ?? undefined,
      select: select ?? undefined,
      values,
      where: where ?? undefined
    }
  }

  protected createSelectAllPartsLinkKeys (query: Query, keys: SchemaFieldKey[]): QueryParts {
    const values: Struct = {}

    let join = null
    let where = null

    const linkKey = keys.find((key) => {
      return query[key.column] !== undefined
    })

    if (linkKey !== undefined) {
      values[`${linkKey.table}_${linkKey.column}`] = query[linkKey.column]
      join = `JOIN $[${linkKey.table}] USING ($[${linkKey.column}])`
      where = `$[${linkKey.table}.${linkKey.column}] = $(${linkKey.table}_${linkKey.column})`
    }

    return {
      join: join ?? undefined,
      values,
      where: where ?? undefined
    }
  }

  protected createSelectAllPartsSearchKeys (query: Query, keys: SchemaFieldKey[], locale?: string): QueryParts {
    const values: Struct = {}

    let where: string | undefined = this.I18n
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
      where = undefined
    }

    return {
      values,
      where
    }
  }

  protected createSelectAllPartsSortKeys (query: Query, keys: SchemaFieldKey[]): QueryParts {
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

  protected createSelectParts (query: Query, keys: QueryKeys): QueryParts {
    const values: Struct = {}

    let where = keys.primary
      ?.map((key) => {
        values[`${key.table}_${key.column}`] = query[key.column]
        return `$[${key.table}.${key.column}] = $(${key.table}_${key.column})`
      })
      .join(') AND (')

    if (
      where !== undefined &&
      where.length > 0
    ) {
      where = `(${where})`
    } else {
      where = undefined
    }

    return {
      values,
      where
    }
  }

  public abstract formatDdl (name: string, fields: Struct<SchemaField>): string

  public abstract formatIdentifier (value: string): string

  public abstract formatParameter (value: unknown): string

  protected abstract createSelectAllPartsLimit (query: Query): QueryParts
}
