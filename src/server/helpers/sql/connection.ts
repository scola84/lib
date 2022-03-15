import type { Readable } from 'stream'
import type { SqlFormatter } from './formatter'
import type { SqlQuery } from './query'
import type { Struct } from '../../../common'

/**
 * Executes database queries.
 */
export abstract class SqlConnection {
  /**
   * The pool connection.
   */
  public connection: unknown

  /**
   * The formatter.
   */
  public abstract formatter: SqlFormatter

  /**
   * Deletes zero or more rows from the database.
   *
   * @param string - The SQL string
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
   * console.log(count) // count = 1 if there is one row with c1 = v1
   * ```
   */
  public abstract delete<Values = Struct>(string: string, values?: Partial<Values>): Promise<Partial<Values> | undefined>

  /**
   * Depopulates the database.
   *
   * @param population - The population
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
  public abstract depopulate (population: Partial<Struct<Array<Partial<unknown>>>>): Promise<void>

  /**
   * Executes any query against the database.
   *
   * @param query - The query
   * @returns The query result
   */
  public abstract execute<Values = Struct>(query: SqlQuery<Values>): Promise<unknown>

  /**
   * Inserts one row into the database.
   *
   * @param string - The SQL string
   * @param values - The values
   * @param key - The primary key
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
   * console.log(id) // id = 1
   * ```
   */
  public abstract insert<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>, key?: string): Promise<Result>

  /**
   * Inserts zero or more rows into the database.
   *
   * @param string - The SQL string
   * @param values - The values
   * @param key - The primary key
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
   * console.log(result) // result = [{ id: 1 }]
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
   * console.log(result) // result = [{ id: 1 }, { id: 2 }]
   * ```
   */
  public abstract insertAll<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>, key?: string): Promise<Result[]>

  /**
   * Populates the database.
   *
   * @param population - The population
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
  public abstract populate (population: Partial<Struct<Array<Partial<unknown>>>>): Promise<void>

  /**
   * Releases the connection.
   */
  public abstract release (): void

  /**
   * Selects zero or one row from the database.
   *
   * @param string - The SQL string
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
   * console.log(result) // result = { id: 1, c1: 'v1' }
   * ```
   */
  public abstract select<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result | undefined>

  /**
   * Selects multiple rows from the database.
   *
   * @param string - The SQL string
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
   * console.log(result) // result = [{ id: 1, c1: 'v1' }]
   * ```
   */
  public abstract selectAll<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result[]>

  /**
   * Selects one row from the database.
   *
   * @param string - The SQL string
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
   * console.log(result) // result = { id: 1, c1: 'v1' }
   * ```
   */
  public abstract selectOne<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result>

  /**
   * Creates a stream of the selected rows.
   *
   * @param string - The SQL string
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
   *   console.log(row) // row = { id: 1, c1: 'v1' }
   * })
   * ```
   */
  public abstract stream<Values = Struct>(string: string, values?: Partial<Values>): Readable

  /**
   * Updates zero or more rows in the database.
   *
   * @param string - The SQL string
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
   * console.log(count) // count = 1
   * ```
   */
  public abstract update<Values = Struct>(string: string, values?: Partial<Values>): Promise<Partial<Values> | undefined>
}
