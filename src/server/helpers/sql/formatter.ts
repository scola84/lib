import type { Schema, SchemaField, SchemaFieldKey } from '../schema'
import type { SqlQuery, SqlQueryKeys, SqlQueryParts, SqlSelectAllParameters } from './query'
import { I18n } from '../../../common'
import type { Struct } from '../../../common'
import type { User } from '../../entities'

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

    const string = `
      DELETE
      FROM $[${object}]
      WHERE ${where.join(' AND ')}
    `

    return {
      string,
      values
    }
  }

  public createInsertQuery (object: string, schema: Schema, data: Struct): SqlQuery {
    const columns: string[] = []
    const keys: string[] = []
    const values: Struct = {}

    Object
      .keys(schema)
      .forEach((name) => {
        values[name] = data[name]
        columns.push(`$[${name}]`)
        keys.push(`$(${name})`)
      })

    const string = `
      INSERT INTO $[${object}] (
        ${columns.join(',')}
      ) VALUES (
        ${keys.join(',')}
      )
    `

    return {
      string,
      values
    }
  }

  public createPatchQuery (object: string, keys: SqlQueryKeys, schema: Schema, data: Struct): SqlQuery {
    const values: Struct = {}

    const set = Object
      .keys(schema)
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

    const string = `
      UPDATE $[${object}]
      SET (${set.join(',')})
      WHERE ${where.join(' AND ')}
    `

    return {
      string,
      values
    }
  }

  public createSelectAllQuery (object: string, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], parameters: SqlSelectAllParameters, user?: User): SqlQuery {
    if (authKeys.length === 0) {
      throw new Error(`Auth keys are undefined for "${object}"`)
    }

    const auth = this.createAuthParts(keys, authKeys, user)

    if (
      auth.parts === undefined ||
      auth.parts.length === 0
    ) {
      throw new Error(`Auth is undefined for "${object}"`)
    }

    const selectAll = this.createSelectAllParts(object, parameters, keys)

    const queries = auth.parts.map((authPart) => {
      if (authPart.where === undefined) {
        throw new Error(`Where is undefined for "${object}"`)
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
      string: `
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
    if (authKeys.length === 0) {
      throw new Error(`Auth keys are undefined for "${object}"`)
    }

    const auth = this.createAuthParts(keys, authKeys, user)

    if (
      auth.parts === undefined ||
      auth.parts.length === 0
    ) {
      throw new Error(`Auth is undefined for "${object}"`)
    }

    const select = this.createSelectParts(parameters, keys)

    if (select.where === undefined) {
      throw new Error(`Where is undefined for "${object}"`)
    }

    const queries = auth.parts.map((authPart) => {
      if (authPart.where === undefined) {
        throw new Error(`Where is undefined for "${object}"`)
      }

      return `
        SELECT $[${object}].*
        FROM $[${object}]
        ${authPart.join ?? ''}
        WHERE ${[
          select.where,
          authPart.where
        ].join(' AND ')}
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

  public createUpdateQuery (object: string, keys: SqlQueryKeys, schema: Schema, data: Struct): SqlQuery {
    const values: Struct = {}

    const set = Object
      .keys(schema)
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

    const string = `
      UPDATE $[${object}]
      SET (${set.join(',')})
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
  public formatQuery ({ string, values }: SqlQuery): string {
    return (string.match(/\$[([][\w\s.]+[\])]/gu) ?? []).reduce((result, match) => {
      const key = match.slice(2, -1)

      if (match[1] === '[') {
        return result.replace(match, this.formatIdentifier(key))
      }

      const value = values?.[key]

      if (value === undefined) {
        throw new Error(`Parameter "${key}" is undefined`)
      }

      return result.replace(match, this.formatParameter(value))
    }, string)
  }

  protected createAuthParts (keys: SqlQueryKeys, authKeys: SchemaFieldKey[], user?: User): SqlQueryParts {
    const values: Struct = {}

    const parts = authKeys
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

  protected createSelectAllParts (object: string, parameters: SqlSelectAllParameters, keys: SqlQueryKeys): SqlQueryParts {
    const filterKey = keys.foreign?.find((key) => {
      return parameters[key.column] === undefined
    }) ?? keys.related?.find((key) => {
      return parameters[key.column] === undefined
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

    return this.createSelectAllPartsByKey(object, parameters, keys, searchKeys, sortKeys)
  }

  protected createSelectAllPartsByKey (object: string, parameters: SqlSelectAllParameters, keys: SqlQueryKeys, searchKeys?: SchemaFieldKey[], sortKeys?: SchemaFieldKey[]): SqlQueryParts {
    const foreignParts = this.createSelectAllPartsForeignKeys(parameters, keys.foreign ?? [])
    const relatedParts = this.createSelectAllPartsRelatedKeys(parameters, keys.related ?? [])
    const searchParts = this.createSelectAllPartsSearchKeys(parameters, searchKeys ?? [])
    const sortParts = this.createSelectAllPartsSortKeys(parameters, sortKeys ?? [])
    const limitParts = this.createSelectAllPartsLimit(parameters)

    const join = [
      foreignParts.join,
      relatedParts.join
    ].filter((value) => {
      return value !== undefined
    }).join(' ')

    const { limit } = limitParts
    const order = limitParts.order ?? sortParts.order ?? '1'

    const select = [
      `$[${object}].*`,
      foreignParts.select
    ].filter((value) => {
      return value !== undefined
    }).join(', ')

    const values = {
      ...foreignParts.values,
      ...relatedParts.values,
      ...limitParts.values,
      ...searchParts.values
    }

    const where = [
      foreignParts.where,
      relatedParts.where,
      limitParts.where,
      searchParts.where
    ].filter((value) => {
      return value !== undefined
    }).join(' AND ')

    return {
      join,
      limit,
      order,
      select,
      values,
      where
    }
  }

  protected createSelectAllPartsForeignKeys (parameters: SqlSelectAllParameters, keys: SchemaFieldKey[]): SqlQueryParts {
    const values: Struct = {}

    let join = null
    let select = null
    let where = null

    const joinKey = keys.find((key) => {
      return parameters[key.column] === undefined
    })

    if (joinKey !== undefined) {
      join = `JOIN $[${joinKey.table}] USING ($[${joinKey.column}])`
      select = `$[${joinKey.table}.${joinKey.column}].*`
    }

    const whereKey = keys.find((key) => {
      return parameters[key.column] !== undefined
    })

    if (whereKey !== undefined) {
      values[`${whereKey.table}_${whereKey.column}`] = parameters[whereKey.column]
      where = `$[${whereKey.table}.${whereKey.column}] = $(${whereKey.table}_${whereKey.column})`
    }

    return {
      join: join ?? undefined,
      select: select ?? undefined,
      values,
      where: where ?? undefined
    }
  }

  protected createSelectAllPartsRelatedKeys (parameters: SqlSelectAllParameters, keys: SchemaFieldKey[]): SqlQueryParts {
    const values: Struct = {}

    let join = null
    let where = null

    const relatedKey = keys.find((key) => {
      return parameters[key.column] !== undefined
    })

    if (relatedKey !== undefined) {
      values[`${relatedKey.table}_${relatedKey.column}`] = parameters[relatedKey.column]
      join = `JOIN $[${relatedKey.table}] USING ($[${relatedKey.column}])`
      where = `$[${relatedKey.table}.${relatedKey.column}] = $(${relatedKey.table}_${relatedKey.column})`
    }

    return {
      join: join ?? undefined,
      values,
      where: where ?? undefined
    }
  }

  protected createSelectAllPartsSearchKeys (parameters: SqlSelectAllParameters, keys: SchemaFieldKey[], locale?: string): SqlQueryParts {
    const values: Struct = {}

    let where: string | undefined = this.i18n
      .parse(String(parameters.search ?? ''), locale)
      .map((search, index) => {
        return keys
          .filter((key) => {
            return (
              search.key === undefined ||
            `${key.table}_${key.column}` === search.key
            )
          })
          .map((key) => {
            values[`${key.table}_${key.column}_${index}`] = search.value
            return `$[${key.table}.${key.column}] LIKE $(${key.table}_${key.column}_${index})`
          })
          .join(') OR (')
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

  protected createSelectAllPartsSortKeys (parameters: SqlSelectAllParameters, keys: SchemaFieldKey[]): SqlQueryParts {
    let order = null

    if (parameters.sortKey !== undefined) {
      const sortKey = keys.find((key) => {
        return `${key.table}_${key.column}` === parameters.sortKey
      })

      if (sortKey !== undefined) {
        order = `$[${sortKey.table}.${sortKey.column}] ${parameters.sortOrder ?? 'ASC'}`
      }
    }

    return {
      order: order ?? undefined
    }
  }

  protected createSelectParts (parameters: Struct, keys: SqlQueryKeys): SqlQueryParts {
    const values: Struct = {}

    let where = keys.primary
      ?.map((key) => {
        values[`${key.table}_${key.column}`] = parameters[key.column]
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

  protected abstract createSelectAllPartsLimit (parameters: SqlSelectAllParameters): SqlQueryParts
}
