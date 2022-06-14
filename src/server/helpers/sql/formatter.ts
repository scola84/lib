import { I18n, Struct, flatten, toJoint } from '../../../common'
import type { Query, User } from '../../../common'
import type { Schema, SchemaField, SchemaFieldKey } from '../schema'
import type { SqlQuery, SqlQueryKeys, SqlQueryParts } from './query'
import { sql } from './tag'

export interface SqlDdl {
  connect: string
  create: string
  fkeys: string
  indexes: string
}

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

    if (columns.length === 0) {
      throw new Error('Columns are undefined')
    }

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
    const selectors = this.createSelectors(object, schema, query)

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error('Where is undefined')
      }

      return sql`
        SELECT ${selectors}
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

  public createSelectManyInQuery (object: string, schema: Schema, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], data: Struct[], query: Query, user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const select = this.createSelectManyInParts(keys, data)
    const selectors = this.createSelectors(object, schema, query)

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
        SELECT ${selectors}
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

  public createSelectManyModifiedQuery (object: string, schema: Schema, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], query: Query, user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const select = this.createSelectManyModifiedParts(keys, query)
    const selectors = this.createSelectors(object, schema, query)

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
        SELECT ${selectors}
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

  public createSelectManyQuery (object: string, schema: Schema, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], query: Query, user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const select = this.createSelectManyParts(keys)
    const selectors = this.createSelectors(object, schema, query)

    const queries = auth.parts.map((authPart) => {
      if (
        keys.auth !== undefined &&
        authPart.where === undefined
      ) {
        throw new Error('Where is undefined')
      }

      return sql`
        SELECT ${select.select ?? selectors}
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

  public createSelectOneQuery (object: string, schema: Schema, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], query: Query, user?: User): SqlQuery {
    const auth = this.createAuthParts(keys, authKeys, user)
    const select = this.createSelectParts(keys, query)
    const selectors = this.createSelectors(object, schema, query)

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
        SELECT ${selectors}
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

  public createSelectQuery (object: string, keys: SqlQueryKeys, authKeys: SchemaFieldKey[], query: Query, user?: User): SqlQuery {
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

    const primaryKeys = keys.primary?.map((key) => {
      return key.column
    })

    const set = Object
      .entries(schema)
      .filter(([name, field]) => {
        return (
          primaryKeys?.includes(name) !== true &&
          field.var !== '$created'
        )
      })
      .filter(([name, field]) => {
        return (
          data[name] !== undefined ||
          field.var === '$updated'
        )
      })
      .map(([name, field]) => {
        values[name] = this.resolveValue(field, data[name], user)
        return `$[${name}] = $(${name})`
      })

    if (set.length === 0) {
      throw new Error('Set is undefined')
    }

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
    return (query.string.match(/\\?\$[([].+?[\])]/gu) ?? []).reduce((result, match) => {
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
      values,
      where
    }
  }

  protected createSelectAllPartsForeign (object: string, keys: SqlQueryKeys, query: Query): SqlQueryParts {
    const join: string[] = []
    const values = Struct.create()

    let where = null as string | null

    keys.foreign?.forEach((key) => {
      if (query.join !== undefined) {
        if (query.join[key.table] === undefined) {
          join.push(`JOIN $[${key.table}] ON $[${object}.${key.column}] = $[${key.table}.${key.column}]`)
        } else {
          values[`${object}_${key.column}`] = query.join[key.table]?.[key.column]
          where = `$[${object}.${key.column}] = $(${object}_${key.column})`
        }
      }
    })

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
    const join: string[] = []
    const values = Struct.create()
    const where: string[] = []

    keys.related?.forEach((key) => {
      if (query.join?.[key.table] !== undefined) {
        values[`${key.table}_${key.column}`] = query.join[key.table]?.[key.column]
        join.push(`JOIN $[${key.table}] ON $[${object}.${key.column}] = $[${key.table}.${key.column}]`)
        where.push(`$[${key.table}.${key.column}] = $(${key.table}_${key.column})`)
      }
    })

    return {
      join: this.joinStrings(' ', join) ?? undefined,
      values: values,
      where: this.joinStrings(' AND ', where) ?? undefined
    }
  }

  protected createSelectAllPartsWhere (object: string, schema: Partial<Schema>, query: Query): SqlQueryParts {
    const operators = flatten<string | undefined>(query.operator ?? {})
    const values = Struct.create()

    let prefix = ''

    if (schema.select?.schema?.[object] === undefined) {
      prefix = `${object}.`
    }

    const where = this.joinStrings(' AND ', Object
      .entries(flatten<unknown>(query.where ?? {}))
      .map(([name, value]) => {
        const operator = operators[name] ?? '='

        const valueKey = toJoint(`${prefix}${name}`, {
          separator: '_'
        })

        values[valueKey] = value

        if (operator === 'LIKE') {
          return `LOWER($[${prefix}${name}]) ${operator} LOWER($(${valueKey}))`
        }

        return `$[${prefix}${name}] ${operator} $(${valueKey})`
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

  protected createSelectManyModifiedParts (keys: SqlQueryKeys, query: Query): SqlQueryParts {
    const values = Struct.create()

    let where = ''

    if (keys.modified !== undefined) {
      values[`${keys.modified.table}_${keys.modified.column}`] = query.where?.[keys.modified.column]
      where += `$[${keys.modified.table}.${keys.modified.column}] >= $(${keys.modified.table}_${keys.modified.column})`
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

  protected createSelectParts (keys: SqlQueryKeys, query: Query): SqlQueryParts {
    const values = Struct.create()

    const where = this.joinStrings(' AND ', keys.primary?.map((key) => {
      values[`${key.table}_${key.column}`] = query.where?.[key.column]
      return `$[${key.table}.${key.column}] = $(${key.table}_${key.column})`
    }) ?? [])

    return {
      values,
      where
    }
  }

  protected createSelectors (object: string, schema: Partial<Schema>, query: Query): string {
    const booleans = flatten<boolean | undefined>(query.select ?? {})
    const hasNegatives = Object.values(booleans).includes(false)
    const hasPositives = Object.values(booleans).includes(true)

    let names: string[] = []
    let prefix = ''

    if (schema.select?.schema?.[object] === undefined) {
      names = Object.keys(schema.select?.schema ?? {})
      prefix = `${object}.`
    } else {
      names = Object
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

    return this.joinStrings(', ', names.map((name) => {
      if (hasPositives) {
        if (booleans[name] === true) {
          return `$[${prefix}${name}]`
        }
      } else if (hasNegatives) {
        if (booleans[name] !== false) {
          return `$[${prefix}${name}]`
        }
      } else {
        return `$[${prefix}${name}]`
      }

      return undefined
    })) ?? '1 AS $[1]'
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
    switch (field.var) {
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

  public abstract formatDdl (database: string, object: string, fields: Struct<SchemaField>): SqlDdl

  public abstract formatIdentifier (value: string): string

  public abstract formatParameter (value: unknown): string

  protected abstract createSelectAllPartsLimit (query: Query): SqlQueryParts
}
