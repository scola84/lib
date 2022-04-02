import { I18n, Struct, flatten } from '../../../common'
import type { Schema, SchemaField, SchemaFieldKey } from '../schema'
import type { SqlQuery, SqlQueryKeys, SqlQueryParts } from './query'
import type { Query } from '../../../common'
import type { User } from '../../entities'
import { sql } from './tag'

export abstract class SqlFormatter {
  public i18n = new I18n()

  public createDeleteAllQuery (object: string, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const deleteAll = this.createDeleteAllParts(keys)

    if (deleteAll.where === undefined) {
      throw new Error('Where is undefined')
    }

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error('Where is undefined')
      }

      if (deleteAll.select === undefined) {
        throw new Error('Select is undefined')
      }

      return sql`
        SELECT ${deleteAll.select}
        FROM $[${object}]
        ${authPart.join ?? ''}
        WHERE ${authPart.where ?? '1 = 1'}
      `
    })

    return {
      string: sql`
        DELETE
        FROM $[${object}]
        WHERE (${deleteAll.where}) IN (
          ${queries.join(' UNION ')}
        )
      `,
      values: auth.values
    }
  }

  public createDeleteQuery (object: string, keys: SqlQueryKeys, data: Struct): SqlQuery {
    const values = Struct.create()

    const where = keys.primary?.map((key) => {
      values[key.column] = data[key.column]
      return `$[${key.column}] = $(${key.column})`
    })

    if (where === undefined) {
      throw new Error('Where is undefined')
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

  public createInsertQuery (object: string, schema: Schema, keys: SqlQueryKeys, data: Struct, user?: User): SqlQuery {
    const columns: string[] = []
    const values = Struct.create()
    const valuesKeys: string[] = []

    Object
      .entries(schema)
      .forEach(([name, field]) => {
        columns.push(`$[${name}]`)
        valuesKeys.push(`$(${name})`)
        values[name] = this.resolveValue(field, data[name], user)
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

  public createSelectAllQuery (object: string, schema: Schema, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], query: Query, user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const selectAll = this.createSelectAllParts(object, schema, keys, query)

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error('Where is undefined')
      }

      return sql`
        SELECT ${selectAll.select ?? '1 AS $[1]'}
        FROM $[${object}]
        ${selectAll.join ?? ''}
        ${authPart.join ?? ''}
        WHERE ${this.joinStrings(' AND ', [
          selectAll.where,
          authPart.where
        ]) ?? '1 = 1'}
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

  public createSelectManyInQuery (object: string, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], data: Struct[], user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const select = this.createSelectManyInParts(keys, data)

    if (select.where === undefined) {
      throw new Error('Where is undefined')
    }

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error('Where is undefined')
      }

      return sql`
        SELECT $[${object}].*
        FROM $[${object}]
        ${authPart.join ?? ''}
        WHERE ${this.joinStrings(' AND ', [
          select.where,
          authPart.where
        ]) ?? '1 = 1'}
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

  public createSelectManyModifiedQuery (object: string, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], modified: Date, user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const select = this.createSelectManyModifiedParts(keys, modified)

    if (select.where === undefined) {
      throw new Error('Where is undefined')
    }

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error('Where is undefined')
      }

      return sql`
        SELECT $[${object}].*
        FROM $[${object}]
        ${authPart.join ?? ''}
        WHERE ${this.joinStrings(' AND ', [
          select.where,
          authPart.where
        ]) ?? '1 = 1'}
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

  public createSelectManyQuery (object: string, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const select = this.createSelectManyParts(keys)

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error('Where is undefined')
      }

      return sql`
        SELECT ${select.select ?? `$[${object}].*`}
        FROM $[${object}]
        ${authPart.join ?? ''}
        WHERE ${authPart.where ?? '1 = 1'}
      `
    })

    return {
      string: queries.join(' UNION '),
      values: auth.values
    }
  }

  public createSelectQuery (object: string, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], query: Struct, user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const select = this.createSelectParts(keys, query)

    if (select.where === undefined) {
      throw new Error('Where is undefined')
    }

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error('Where is undefined')
      }

      return sql`
        SELECT $[${object}].*
        FROM $[${object}]
        ${authPart.join ?? ''}
        WHERE ${this.joinStrings(' AND ', [
          select.where,
          authPart.where
        ]) ?? '1 = 1'}
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

  public createUpdateQuery (object: string, schema: Schema, keys: SqlQueryKeys, data: Struct, user?: User): SqlQuery {
    const values = Struct.create()

    const set = Object
      .entries(schema)
      .filter(([name]) => {
        return keys.primary?.every((key) => {
          return key.column !== name
        })
      })
      .filter(([name]) => {
        return data[name] !== undefined
      })
      .map(([name, field]) => {
        values[name] = this.resolveValue(field, data[name], user)
        return `$[${name}] = $(${name})`
      })

    const where = keys.primary?.map((key) => {
      values[key.column] = data[key.column]
      return `$[${key.column}] = $(${key.column})`
    })

    if (where === undefined) {
      throw new Error('Where is undefined')
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
    return (query.string.match(/\\?\$[([][\w\s.]+[\])]/gu) ?? []).reduce((result, match) => {
      const key = match.slice(2, -1)

      if (match.startsWith('\\')) {
        return result.replace(match, match.slice(1))
      }

      if (match.startsWith('$[')) {
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

    const values = Struct.create()

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

  protected createDeleteAllParts (keys: SqlQueryKeys): SqlQueryParts {
    const select = keys.primary?.map((key) => {
      return `$[${key.column}]`
    }) ?? []

    const where = keys.primary?.map((key) => {
      return `$[${key.column}]`
    }) ?? []

    return {
      select: this.joinStrings(', ', select),
      where: this.joinStrings(', ', where)
    }
  }

  protected createSelectAllParts (object: string, schema: Schema, keys: SqlQueryKeys, query: Query): SqlQueryParts {
    const foreignParts = this.createSelectAllPartsForeign(object, keys, query)
    const limitParts = this.createSelectAllPartsLimit(query)
    const orderParts = this.createSelectAllPartsOrder(object, schema, query)
    const relatedParts = this.createSelectAllPartsRelated(object, keys, query)
    const selectParts = this.createSelectAllPartsSelect(object, schema, query)
    const whereParts = this.createSelectAllPartsWhere(object, schema, query)

    const join = this.joinStrings(' ', [
      foreignParts.join,
      relatedParts.join
    ])

    const where = this.joinStrings(' AND ', [
      foreignParts.where,
      relatedParts.where,
      limitParts.where,
      whereParts.where
    ])

    const { limit } = limitParts
    const order = limitParts.order ?? orderParts.order ?? '1'
    const { select } = selectParts

    const values = {
      ...foreignParts.values,
      ...relatedParts.values,
      ...limitParts.values,
      ...whereParts.values
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

  protected createSelectAllPartsForeign (object: string, keys: SqlQueryKeys, query: Query): SqlQueryParts {
    const join: string[] = []
    const values = Struct.create()

    keys.foreign
      ?.filter((key) => {
        return (
          query.join !== undefined &&
          query.join[key.table] === undefined
        )
      })
      .forEach((key) => {
        join.push(`JOIN $[${key.table}] ON $[${object}.${key.column}] = $[${key.table}.${key.column}]`)
      })

    let where = null

    const joinKey = keys.foreign?.find((key) => {
      return query.join?.[key.table] !== undefined
    })

    if (joinKey !== undefined) {
      values[`${object}_${joinKey.column}`] = query.join?.[joinKey.table]?.[joinKey.column]
      where = `$[${object}.${joinKey.column}] = $(${object}_${joinKey.column})`
    }

    return {
      join: this.joinStrings(' ', join) ?? undefined,
      values: values,
      where: where ?? undefined
    }
  }

  protected createSelectAllPartsOrder (object: string, schema: Schema, query: Query): SqlQueryParts {
    let prefix = ''

    if (schema.select.schema?.[object] === undefined) {
      prefix = `${object}.`
    }

    const order = this.joinStrings(', ', Object
      .entries(flatten<string | undefined>(query.order ?? {}))
      .map(([name, direction]) => {
        return `$[${prefix}${name}] ${direction?.toUpperCase() ?? 'ASC'}`
      }))

    return {
      order: order ?? undefined
    }
  }

  protected createSelectAllPartsRelated (object: string, keys: SqlQueryKeys, query: Query): SqlQueryParts {
    const joinKey = keys.related?.find((key) => {
      return query.join?.[key.table] !== undefined
    })

    const values = Struct.create()

    let join = null
    let where = null

    if (joinKey !== undefined) {
      values[`${joinKey.table}_${joinKey.column}`] = query.join?.[joinKey.table]?.[joinKey.column]
      join = `JOIN $[${joinKey.table}] ON $[${object}.${joinKey.column}] = $[${joinKey.table}.${joinKey.column}]`
      where = `$[${joinKey.table}.${joinKey.column}] = $(${joinKey.table}_${joinKey.column})`
    }

    return {
      join: join ?? undefined,
      values: values,
      where: where ?? undefined
    }
  }

  protected createSelectAllPartsSelect (object: string, schema: Schema, query: Query): SqlQueryParts {
    const booleans = flatten<boolean | undefined>(query.select ?? {})
    const hasNegatives = Object.values(booleans).includes(false)
    const hasPositives = Object.values(booleans).includes(true)

    let fields: string[] = []
    let prefix = ''

    if (schema.select.schema?.[object] === undefined) {
      fields = Object.keys(schema.select.schema ?? {})
      prefix = `${object}.`
    } else {
      fields = Object
        .entries(schema.select.schema)
        .map(([table, field]) => {
          return Object
            .keys(field.schema ?? {})
            .map((column) => {
              return `${table}.${column}`
            })
        })
        .flat()
    }

    const select = this.joinStrings(', ', fields.map((name) => {
      const identifier = `${prefix}${name}`

      if (hasPositives) {
        if (booleans[name] === true) {
          return `$[${identifier}]`
        }
      } else if (hasNegatives) {
        if (booleans[name] !== false) {
          return `$[${identifier}]`
        }
      } else {
        return `$[${identifier}]`
      }

      return undefined
    }))

    return {
      select
    }
  }

  protected createSelectAllPartsWhere (object: string, schema: Schema, query: Query): SqlQueryParts {
    const values = Struct.create()
    const operators = flatten<string | undefined>(query.operator ?? {})

    let prefix = ''

    if (schema.select.schema?.[object] === undefined) {
      prefix = `${object}.`
    }

    const where = this.joinStrings(' AND ', Object
      .entries(flatten<unknown>(query.where ?? {}))
      .map(([name, value]) => {
        const identifier = `${prefix}${name}`
        const key = identifier.replace('.', '_')
        const operator = operators[name] ?? '='

        values[key] = value

        if (operator === 'LIKE') {
          return `LOWER($[${identifier}]) ${operator} LOWER($(${key}))`
        }

        return `$[${identifier}] ${operator} $(${key})`
      }))

    return {
      values,
      where
    }
  }

  protected createSelectManyInParts (keys: SqlQueryKeys, data: Struct[]): SqlQueryParts {
    const values = Struct.create()

    const where = this.joinStrings(' AND ', keys.primary?.map((key) => {
      if (data.length === 0) {
        values[`${key.table}_${key.column}`] = [[0]]
      } else {
        values[`${key.table}_${key.column}`] = [data.map((datum) => {
          return datum[key.column] ?? 0
        })]
      }

      return `$[${key.table}.${key.column}] IN $(${key.table}_${key.column})`
    }) ?? [])

    return {
      values,
      where
    }
  }

  protected createSelectManyModifiedParts (keys: SqlQueryKeys, modified: Date): SqlQueryParts {
    const key = keys.modified
    const values = Struct.create()

    let where = ''

    if (key !== undefined) {
      values[`${key.table}_${key.column}`] = modified
      where += `$[${key.table}.${key.column}] >= $(${key.table}_${key.column})`
    }

    return {
      values,
      where
    }
  }

  protected createSelectManyParts (keys: SqlQueryKeys): SqlQueryParts {
    const select = keys.primary?.map((key) => {
      return `$[${key.table}.${key.column}]`
    })

    if (keys.modified !== undefined) {
      select?.push(`$[${keys.modified.table}.${keys.modified.column}]`)
    }

    return {
      select: select?.join(', ')
    }
  }

  protected createSelectParts (keys: SqlQueryKeys, query: Struct): SqlQueryParts {
    const values = Struct.create()

    const where = this.joinStrings(' AND ', keys.primary?.map((key) => {
      values[`${key.table}_${key.column}`] = query[key.column]
      return `$[${key.table}.${key.column}] = $(${key.table}_${key.column})`
    }) ?? [])

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

    const joinedString = filteredStrings.join(delimiter)

    if (
      delimiter.startsWith(')') &&
      delimiter.endsWith('(')
    ) {
      return `(${joinedString})`
    }

    return joinedString
  }

  protected resolveValue (field: SchemaField, value: unknown, user?: User): unknown {
    switch (field.default) {
      case '$created':
        return new Date()
      case '$group_id':
        return user?.group_id ?? 0
      case '$updated':
        return new Date()
      case '$user_id':
        return user?.user_id ?? 0
      default:
        return value
    }
  }

  public abstract formatDdl (database: string, object: string, fields: Struct<SchemaField>): string

  public abstract formatIdentifier (value: string): string

  public abstract formatParameter (value: unknown): string

  protected abstract createSelectAllPartsLimit (query: Query): SqlQueryParts
}
