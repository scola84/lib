import type { Readable } from 'stream'
import { sql } from './tag'
import type tokens from './tokens'

/**
 * The result of a DELETE query.
 */
export interface DeleteResult {
  /**
   * The number of affected rows.
   */
  count: number
}

/**
 * The result of an INSERT query.
 */
export interface InsertResult<R = number> {
  /**
   * The id of the inserted row.
   */
  id: R
}

/**
 * The result of an UPDATE query.
 */
export interface UpdateResult {
  /**
   * The number of affected rows.
   */
  count: number
}

/**
 * Executes database queries.
 */
export abstract class Connection {
  /**
   * The pool connection.
   */
  public connection: unknown

  /**
   * Formats a query to a dialect-specific form.
   *
   * Replaces all parameters in the query with the given values. A parameter should be written as `$(name)`.
   *
   * Escapes all values, stringifies objects to JSON and arrays of arrays to bulk INSERTs.
   *
   * @param query - The query
   * @param values - The values
   * @returns The formatted query
   * @throws a parameter from the query is not found in the values object
   *
   * @example
   * ```ts
   * const query = connection.format(sql`
   *   SELECT *
   *   FROM t1
   *   WHERE c1 = $(c1)
   * `, {
   *   c1: 'v1'
   * })
   *
   * // query = 'SELECT * FROM t1 WHERE c1 = "v1"' in MySQL
   * ```
   *
   * @example
   * ```ts
   * const query = connection.format(sql`
   *   INSERT
   *   INTO t1 (c1)
   *   VALUES $(values)
   * `, {
   *   values: [
   *     ['v1'],
   *     ['v2']
   *   ]
   * })
   *
   * // query = 'INSERT INTO t1 VALUES ("v1"), ("v2")' in MySQL
   * ```
   */
  public abstract format: (query: string, values: Record<string, unknown>) => string

  /**
   * Dialect-specific tokens, e.g. '~' or 'REGEXP' for applying a regular expression in PostgreSQL or MySQL respectively.
   */
  public abstract tokens: tokens

  /**
   * Depopulates the database.
   *
   * @param entities - The entities
   * @returns The ids of the deleted entities
   *
   * @example
   * ```ts
   * const result = connection.depopulate({
   *   t1: [{
   *     c1: 'v1'
   *   }, {
   *     c1: 'v2'
   *   }]
   * })
   *
   * // result = { t1: [{ count: 1 }, { count: 2 }] }
   * ```
   */
  public async depopulate (entities: Record<string, Array<Partial<unknown>>>): Promise<Record<string, Array<Partial<DeleteResult>>>> {
    const result: Record<string, Array<Partial<DeleteResult>>> = {}

    await Promise.all(Object
      .keys(entities)
      .map((table) => {
        result[table] = []
        return table
      })
      .map(async (table) => {
        return Promise.all(entities[table].map(async (object, index) => {
          result[table][index] = await this.delete(sql`
            DELETE
            FROM ${table}
            WHERE ${
              Object
                .keys(object)
                .filter((column) => {
                  return column.endsWith('id')
                })
                .map((column) => {
                  return `${column} = $(${column})`
                })
                .join(' AND ')
            }
          `, object)
        }))
      }))

    return result
  }

  /**
   * Populates the database.
   *
   * @param entities - The entities
   * @returns The ids of the inserted entities
   *
   * @example
   * ```ts
   * const result = connection.populate({
   *   t1: [{
   *     c1: 'v1'
   *   }, {
   *     c1: 'v2'
   *   }]
   * })
   *
   * // result = { t1: [{ id: 1 }, { id: 2 }] }
   * ```
   */
  public async populate<R = number>(entities: Record<string, Array<Partial<unknown>>>): Promise<Record<string, Array<Partial<InsertResult<R>>>>> {
    const result: Record<string, Array<Partial<InsertResult<R>>>> = {}

    await Promise.all(Object
      .keys(entities)
      .map((table) => {
        result[table] = []
        return table
      })
      .map(async (table) => {
        return Promise.all(entities[table].map(async (object, index) => {
          result[table][index] = await this.insert<unknown, R>(sql`
            INSERT INTO ${table} (${
              Object
                .keys(object)
                .join(',')
            }) VALUES (${
              Object
                .keys(object)
                .map((column) => {
                  return `$(${column})`
                })
              .join(',')
            })
          `, object)
        }))
      }))

    return result
  }

  /**
   * Deletes zero or more rows from the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The number of affected rows
   *
   * @example
   * ```ts
   * const { count } = connection.delete(sql`
   *   DELETE
   *   FROM t1
   *   WHERE c1 = $(c1)
   * `, {
   *   c1: 'v1'
   * })
   *
   * // count = 1 if there is one row with c1 = v1
   * ```
   */
  public abstract delete<V>(query: string, values?: Partial<V>): Promise<DeleteResult>

  /**
   * Inserts one row into the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The id of the inserted row
   *
   * @example
   * ```ts
   * const { id } = connection.insert(sql`
   *   INSERT
   *   INTO t1 (c1)
   *   VALUES ($(c1))
   * `, {
   *   c1: 'v1'
   * })
   *
   * // id = 1
   * ```
   */
  public abstract insert<V, R = number>(query: string, values?: Partial<V>, key?: string): Promise<InsertResult<R>>

  /**
   * Inserts zero or more rows into the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The ids of the inserted rows
   *
   * @example
   * ```ts
   * const result = connection.insertAll(sql`
   *   INSERT
   *   INTO t1 (c1)
   *   VALUES ($(c1))
   * `, {
   *   c1: 'v1'
   * })
   *
   * // result = [{ id: 1 }]
   * ```
   *
   * @example
   * ```ts
   * const result = connection.insertAll(sql`
   *   INSERT
   *   INTO t1 (c1)
   *   VALUES $(values)
   * `, {
   *   values: [
   *     ['v1'],
   *     ['v2']
   *   ]
   * })
   *
   * // result = [{ id: 1 }, { id: 2 }]
   * ```
   */
  public abstract insertAll<V, R = number>(query: string, values?: Partial<V>, key?: string): Promise<Array<InsertResult<R>>>

  /**
   * Inserts one row into the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The id of the inserted row
   *
   * @example
   * ```ts
   * const { id } = connection.insertOne(sql`
   *   INSERT
   *   INTO t1 (c1)
   *   VALUES ($(c1))
   * `, {
   *   c1: 'v1'
   * })
   *
   * // id = 1
   * ```
   */
  public abstract insertOne<V, R = number>(query: string, values?: Partial<V>, key?: string): Promise<InsertResult<R>>

  /**
   * Executes any query against the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The query-specific result set
   */
  public abstract query<V, R>(query: string, values?: Partial<V>): Promise<R>

  /**
   * Releases the connection.
   */
  public abstract release (): void

  /**
   * Selects zero or one row from the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The selected row
   *
   * @example
   * ```ts
   * const result = connection.select(sql`
   *   SELECT
   *     c1,
   *     id
   *   FROM t1
   *   WHERE id = $(id)
   * `, {
   *   id: 1
   * })
   *
   * // result = { id: 1, c1: 'v1' }
   * ```
   */
  public abstract select<V, R>(query: string, values?: Partial<V>): Promise<R | undefined>

  /**
   * Selects multiple rows from the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The selected rows
   *
   * @example
   * ```ts
   * const result = connection.selectAll(sql`
   *   SELECT
   *     c1,
   *     id
   *   FROM t1
   *   WHERE id = $(id)
   * `, {
   *   id: 1
   * })
   *
   * // result = [{ id: 1, c1: 'v1' }]
   * ```
   */
  public abstract selectAll<V, R>(query: string, values?: Partial<V>): Promise<R[]>

  /**
   * Selects one row from the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The selected row
   * @throws zero rows were found
   *
   * @example
   * ```ts
   * const result = connection.selectOne(sql`
   *   SELECT
   *     c1,
   *     id
   *   FROM t1
   *   WHERE id = $(id)
   * `, {
   *   id: 1
   * })
   *
   * // result = { id: 1, c1: 'v1' }
   * ```
   */
  public abstract selectOne<V, R>(query: string, values?: Partial<V>): Promise<R>

  /**
   * Creates a stream of the selected rows.
   *
   * @param query - The query
   * @param values - The values
   * @returns The stream
   *
   * @example
   * ```ts
   * const reader = connection.stream(sql`
   *   SELECT
   *     c1,
   *     id
   *   FROM t1
   * `)
   *
   * reader.on('data', (row) => {
   *   console.log(row)
   *   // row = { id: 1, c1: 'v1' }
   * })
   * ```
   */
  public abstract stream<V>(query: string, values?: Partial<V>): Readable

  /**
   * Updates zero or more rows in the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The number of affected rows
   *
   * @example
   * ```ts
   * const { count } = connection.update(sql`
   *   UPDATE t1
   *   SET c1 = $(c1)
   *   WHERE id = $(id)
   * `, {
   *   c1: 'v1',
   *   id: 1
   * })
   *
   * // count = 1
   * ```
   */
  public abstract update<V>(query: string, values?: Partial<V>): Promise<UpdateResult>
}
