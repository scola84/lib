import type { Schema, SchemaField, SchemaFieldKey } from '../schema'
import type { SqlQuery, SqlQueryKeys, SqlQueryParts, SqlSelectAllParameters } from './query'
import { I18n } from '../../../common'
import type { Struct } from '../../../common'
import type { User } from '../../entities'
import { sql } from './tag'

export abstract class SqlFormatter {
  public i18n = new I18n()

  public createDeleteQuery (object: string, keys: SqlQueryKeys, data: Struct): SqlQuery {
    const values: Struct = {}

    const where = keys.primary?.map((key) => {
      values[key.column] = data[key.column]
      return `$[${key.column}] = $(${key.column})`
    })

    if (where === undefined) {
      throw new Error(`Where is undefined for "${object}"`)
    }

    const string = sql`
      DELETE
      FROM $[${object}]
      WHERE ${where.join(' AND ')}
    `

    return {
      string,
      values
    }
  }

  public createInsertQuery (object: string, keys: SqlQueryKeys, schema: Schema, data: Struct): SqlQuery {
    const columns: string[] = []
    const values: Struct = {}
    const valuesKeys: string[] = []

    Object
      .keys(schema)
      .forEach((name) => {
        columns.push(`$[${name}]`)
        valuesKeys.push(`$(${name})`)
        values[name] = data[name]
      })

    const string = sql`
      INSERT INTO $[${object}] (
        ${columns.join(',')}
      ) VALUES (
        ${valuesKeys.join(',')}
      )
    `

    return {
      string,
      values
    }
  }

  public createSelectAllQuery (object: string, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], parameters: SqlSelectAllParameters, user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const selectAll = this.createSelectAllParts(object, parameters, keys)

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error(`Where is undefined for "${object}"`)
      }

      return sql`
        SELECT ${this.joinStrings(', ', [
          `$[${object}].*`,
          selectAll.select
        ]) ?? '*'}
        FROM $[${object}]
        ${selectAll.join ?? ''}
        ${authPart.join ?? ''}
        WHERE ${this.joinStrings(' AND ', [
          selectAll.where,
          authPart.where
        ]) ?? '1=1'}
      `
    })

    return {
      string: sql`
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

  public createSelectQuery (object: string, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], parameters: Struct, user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const select = this.createSelectParts(parameters, keys)

    if (select.where === undefined) {
      throw new Error(`Where is undefined for "${object}"`)
    }

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error(`Where is undefined for "${object}"`)
      }

      return sql`
        SELECT $[${object}].*
        FROM $[${object}]
        ${authPart.join ?? ''}
        WHERE ${this.joinStrings(' AND ', [
          select.where,
          authPart.where
        ]) ?? '1=1'}
      `
    })

    return {
      string: queries.join(' UNION '),
      values: {
        ...select.values,
        ...auth.values
      }
    }
  }

  public createUpdatePartialQuery (object: string, keys: SqlQueryKeys, schema: Schema, data: Struct): SqlQuery {
    const values: Struct = {}

    const set = Object
      .keys(schema)
      .filter((name) => {
        return keys.primary?.every((key) => {
          return key.column !== name
        })
      })
      .filter((name) => {
        return data[name] !== undefined
      })
      .map((name) => {
        values[name] = data[name]
        return `$[${name}] = $(${name})`
      })

    const where = keys.primary?.map((key) => {
      values[key.column] = data[key.column]
      return `$[${key.column}] = $(${key.column})`
    })

    if (where === undefined) {
      throw new Error(`Where is undefined for "${object}"`)
    }

    const string = sql`
      UPDATE $[${object}]
      SET ${set.join(',')}
      WHERE ${where.join(' AND ')}
    `

    return {
      string,
      values
    }
  }

  public createUpdateQuery (object: string, keys: SqlQueryKeys, schema: Schema, data: Struct): SqlQuery {
    const values: Struct = {}

    const set = Object
      .keys(schema)
      .filter((name) => {
        return keys.primary?.every((key) => {
          return key.column !== name
        })
      })
      .map((name) => {
        values[name] = data[name]
        return `$[${name}] = $(${name})`
      })

    const where = keys.primary?.map((key) => {
      values[key.column] = data[key.column]
      return `$[${key.column}] = $(${key.column})`
    })

    if (where === undefined) {
      throw new Error(`Where is undefined for "${object}"`)
    }

    const string = sql`
      UPDATE $[${object}]
      SET ${set.join(',')}
      WHERE ${where.join(' AND ')}
    `

    return {
      string,
      values
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
   * @returns The formatted query
   * @throws a parameter from the query is not found in the values object
   *
   * @example
   * ```ts
   * const query = formatter.formatQuery({
   *   string: sql`
   *     SELECT *
   *     FROM t1
   *     WHERE $[c1] = $(c1)
   *   `,
   *   values: {
   *     c1: 'v1'
   *   }
   * })
   *
   * console.log(query) // query = 'SELECT * FROM t1 WHERE `c1` = "v1"' in MySQL
   * ```
   *
   * @example
   * ```ts
   * const query = formatter.formatQuery({
   *   string: sql`
   *     INSERT
   *     INTO t1 ($[c1])
   *     VALUES $(c1)
   *   `,
   *   values: {
   *     c1: [
   *       ['v1'],
   *       ['v2']
   *     ]
   *   }
   * })
   *
   * console.log(query) // query = 'INSERT INTO t1 (`c1`) VALUES ("v1"), ("v2")' in MySQL
   * ```
   */
  public formatQuery (query: SqlQuery): string {
    return (query.string.match(/\$[([][\w\s.]+[\])]/gu) ?? []).reduce((result, match) => {
      const key = match.slice(2, -1)

      if (match[1] === '[') {
        return result.replace(match, this.formatIdentifier(key))
      }

      return result.replace(match, this.formatParameter(query.values?.[key]))
    }, query.string)
  }

  public sanitizeQuery (query: string): string {
    return query
      .replace(/\n+/gu, '')
      .replace(/\s+/gu, ' ')
      .replace(/(?<=[[(])\s|\s(?=[)\]])/gu, '')
      .trim()
  }

  protected createAuthParts (keys: SqlQueryKeys, authKeys: SchemaFieldKey[], user?: User): Required<Pick<SqlQueryParts, 'parts' | 'values'>> {
    if (authKeys.length === 0) {
      throw new Error('Auth keys are undefined')
    }

    const values: Struct = {}

    let parts: SqlQueryParts[] = authKeys
      .map((authKey) => {
        return keys.auth?.[authKey.column]?.map((joinKeys) => {
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
            join: this.joinStrings(' ', join),
            where: where ?? undefined
          }
        }) ?? []
      })
      .flat()

    if (parts.length === 0) {
      if (keys.auth === undefined) {
        parts = [{}]
      } else {
        throw new Error('Auth is undefined')
      }
    }

    return {
      parts,
      values
    }
  }

  protected createSelectAllParts (object: string, parameters: SqlSelectAllParameters, keys: SqlQueryKeys): SqlQueryParts {
    const filterKey = keys.foreign?.find((key) => {
      return parameters[key.column] === undefined
    }) ?? keys.related?.find((key) => {
      return parameters[key.column] === undefined
    })

    const searchKeys = keys.search?.filter((key) => {
      return (
        key.table === object ||
        key.table === filterKey?.table
      )
    })

    const sortKeys = keys.sort?.filter((key) => {
      return (
        key.table === object ||
        key.table === filterKey?.table
      )
    })

    return this.createSelectAllPartsByKey(object, parameters, keys, searchKeys, sortKeys)
  }

  protected createSelectAllPartsByKey (object: string, parameters: SqlSelectAllParameters, keys: SqlQueryKeys, searchKeys?: SchemaFieldKey[], sortKeys?: SchemaFieldKey[]): SqlQueryParts {
    const foreignParts = this.createSelectAllPartsForeignKeys(object, parameters, keys.foreign ?? [])
    const relatedParts = this.createSelectAllPartsRelatedKeys(object, parameters, keys.related ?? [])
    const searchParts = this.createSelectAllPartsSearchKeys(parameters, searchKeys ?? [])
    const sortParts = this.createSelectAllPartsSortKeys(parameters, sortKeys ?? [])
    const limitParts = this.createSelectAllPartsLimit(parameters)

    const join = this.joinStrings(' ', [
      foreignParts.join,
      relatedParts.join
    ])

    const where = this.joinStrings(' AND ', [
      foreignParts.where,
      relatedParts.where,
      limitParts.where,
      searchParts.where
    ])

    const { limit } = limitParts
    const order = limitParts.order ?? sortParts.order ?? '1'
    const { select } = foreignParts

    const values = {
      ...foreignParts.values,
      ...relatedParts.values,
      ...limitParts.values,
      ...searchParts.values
    }

    return {
      join,
      limit,
      order,
      select,
      values,
      where
    }
  }

  protected createSelectAllPartsForeignKeys (object: string, parameters: SqlSelectAllParameters, keys: SchemaFieldKey[]): SqlQueryParts {
    const join: string[] = []
    const select: string[] = []
    const values: Struct = {}

    keys
      .filter((key) => {
        return parameters[key.column] === undefined
      })
      .forEach((key) => {
        join.push(`JOIN $[${key.table}] ON $[${object}.${key.column}] = $[${key.table}.${key.column}]`)
        select.push(`$[${key.table}].*`)
      })

    let where = null

    const whereKey = keys.find((key) => {
      return parameters[key.column] !== undefined
    })

    if (whereKey !== undefined) {
      values[`${object}_${whereKey.column}`] = parameters[whereKey.column]
      where = `$[${object}.${whereKey.column}] = $(${object}_${whereKey.column})`
    }

    return {
      join: this.joinStrings(' ', join) ?? undefined,
      select: this.joinStrings(', ', select) ?? undefined,
      values: values,
      where: where ?? undefined
    }
  }

  protected createSelectAllPartsRelatedKeys (object: string, parameters: SqlSelectAllParameters, keys: SchemaFieldKey[]): SqlQueryParts {
    const values: Struct = {}

    let join = null
    let where = null

    const relatedKey = keys.find((key) => {
      return parameters[key.column] !== undefined
    })

    if (relatedKey !== undefined) {
      values[`${relatedKey.table}_${relatedKey.column}`] = parameters[relatedKey.column]
      join = `JOIN $[${relatedKey.table}] ON $[${object}.${relatedKey.column}] = $[${relatedKey.table}.${relatedKey.column}]`
      where = `$[${relatedKey.table}.${relatedKey.column}] = $(${relatedKey.table}_${relatedKey.column})`
    }

    return {
      join: join ?? undefined,
      values: values,
      where: where ?? undefined
    }
  }

  protected createSelectAllPartsSearchKeys (parameters: SqlSelectAllParameters, keys: SchemaFieldKey[], locale?: string): SqlQueryParts {
    const values: Struct = {}

    let where: string | undefined = this.joinStrings(') AND (', this.i18n
      .parse(parameters.search ?? '', locale)
      .map((search, index) => {
        return this.joinStrings(') OR (', keys
          .filter((key) => {
            return (
              search.key === undefined ||
            `${key.table}_${key.column}` === search.key
            )
          })
          .map((key) => {
            values[`${key.table}_${key.column}_${index}`] = search.value
            return `$[${key.table}.${key.column}] LIKE $(${key.table}_${key.column}_${index})`
          }))
      })
      .filter((part) => {
        return part !== undefined
      }))

    if (where !== undefined) {
      where = `(${where})`
    }

    return {
      values,
      where
    }
  }

  protected createSelectAllPartsSortKeys (parameters: SqlSelectAllParameters, keys: SchemaFieldKey[]): SqlQueryParts {
    let order = null

    if (parameters.sortKey !== undefined) {
      const sortKey = keys.find((key) => {
        return `${key.table}.${key.column}` === parameters.sortKey
      })

      if (sortKey !== undefined) {
        order = `$[${sortKey.table}.${sortKey.column}] ${parameters.sortOrder?.toUpperCase() ?? 'ASC'}`
      }
    }

    return {
      order: order ?? undefined
    }
  }

  protected createSelectParts (parameters: Struct, keys: SqlQueryKeys): SqlQueryParts {
    const values: Struct = {}

    let where = this.joinStrings(') AND (', keys.primary
      ?.map((key) => {
        values[`${key.table}_${key.column}`] = parameters[key.column]
        return `$[${key.table}.${key.column}] = $(${key.table}_${key.column})`
      }) ?? [])

    if (where !== undefined) {
      where = `(${where})`
    }

    return {
      values,
      where
    }
  }

  protected joinStrings (delimiter: string, strings: Array<string | undefined>): string | undefined {
    const filteredStrings = strings.filter((string) => {
      return string !== undefined
    })

    if (filteredStrings.length === 0) {
      return undefined
    }

    return filteredStrings.join(delimiter)
  }

  public abstract formatDdl (database: string, object: string, fields: Struct<SchemaField>): string

  public abstract formatIdentifier (value: string): string

  public abstract formatParameter (value: unknown): string

  protected abstract createSelectAllPartsLimit (parameters: SqlSelectAllParameters): SqlQueryParts
}
