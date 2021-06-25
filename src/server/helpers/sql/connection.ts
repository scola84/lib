import type { Readable } from 'stream'
import { sql } from './tag'

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
export interface InsertResult<ID = number> {
  /**
   * The id of the inserted row.
   */
  id: ID
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
   * Depopulates the database.
   *
   * Discards any errors.
   *
   * @param entities - The entities
   *
   * @example
   * ```ts
   * connection.depopulate({
   *   t1: [{
   *     c1: 'v1'
   *   }, {
   *     c1: 'v2'
   *   }]
   * })
   * ```
   */
  public async depopulate (entities: Partial<Record<string, Array<Partial<unknown>>>>): Promise<void> {
    await Promise.all(Object
      .entries(entities as Record<string, Array<Partial<unknown>>>)
      .map(async ([table, rows]) => {
        return Promise.all(rows.map(async (object) => {
          try {
            await this.delete(sql`
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
          } catch (error: unknown) {
            // discard error
          }
        }))
      }))
  }

  /**
   * Populates the database.
   *
   * Discards any errors.
   *
   * @param entities - The entities
   *
   * @example
   * ```ts
   * connection.populate({
   *   t1: [{
   *     c1: 'v1'
   *   }, {
   *     c1: 'v2'
   *   }]
   * })
   * ```
   */
  public async populate (entities: Partial<Record<string, Array<Partial<unknown>>>>): Promise<void> {
    await Promise.all(Object
      .entries(entities as Record<string, Array<Partial<unknown>>>)
      .map(async ([table, rows]) => {
        return Promise.all(rows.map(async (object) => {
          try {
            await this.insert(sql`
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
          } catch (error: unknown) {
            // discard error
          }
        }))
      }))
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
  public abstract delete<Values>(query: string, values?: Partial<Values>): Promise<DeleteResult>

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
  public abstract insert<Values, ID = number>(query: string, values?: Partial<Values>, key?: string): Promise<InsertResult<ID>>

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
  public abstract insertAll<Values, ID = number>(query: string, values?: Partial<Values>, key?: string): Promise<Array<InsertResult<ID>>>

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
  public abstract insertOne<Values, ID = number>(query: string, values?: Partial<Values>, key?: string): Promise<InsertResult<ID>>

  /**
   * Executes any query against the database.
   *
   * @param query - The query
   * @param values - The values
   * @returns The query-specific result set
   */
  public abstract query<Values, Result>(query: string, values?: Partial<Values>): Promise<Result>

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
  public abstract select<Values, Result>(query: string, values?: Partial<Values>): Promise<Result | undefined>

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
  public abstract selectAll<Values, Result>(query: string, values?: Partial<Values>): Promise<Result[]>

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
  public abstract selectOne<Values, Result>(query: string, values?: Partial<Values>): Promise<Result>

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
  public abstract stream<Values>(query: string, values?: Partial<Values>): Readable

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
  public abstract update<Values>(query: string, values?: Partial<Values>): Promise<UpdateResult>
}
