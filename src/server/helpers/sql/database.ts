import type { Connection, DeleteResult, InsertResult, UpdateResult } from './connection'
import type { Readable } from 'stream'
import type tokens from './tokens'

/**
 * Manages database connections.
 */
export abstract class Database {
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
   * const query = database.format(sql`
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
   * const query = database.format(sql`
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
   * The connection pool.
   */
  public abstract pool: unknown

  /**
   * Dialect-specific tokens, e.g. '~' or 'REGEXP' for applying a regular expression in PostgreSQL or MySQL respectively.
   */
  public abstract tokens: tokens

  /**
   * Deletes zero or more rows from the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The number of affected rows
   *
   * @example
   * ```ts
   * const { count } = database.delete(sql`
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
  public async delete<V>(query: string, values?: Partial<V>): Promise<DeleteResult> {
    const connection = await this.connect()

    try {
      return await connection.delete<V>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Depopulates the database.
   *
   * Acquires a connection, depopulates the database and releases the connection.
   *
   * @param entities - The entities
   * @returns The ids of the deleted entities
   *
   * @example
   * ```ts
   * const result = database.depopulate({
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
    const connection = await this.connect()

    try {
      return await connection.depopulate(entities)
    } finally {
      connection.release()
    }
  }

  /**
   * Inserts one row into the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The id of the inserted row
   *
   * @example
   * ```ts
   * const { id } = database.insert(sql`
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
  public async insert<V, R = number>(query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const connection = await this.connect()

    try {
      return await connection.insert<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Inserts zero or more rows into the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The ids of the inserted rows
   *
   * @example
   * ```ts
   * const result = database.insertAll(sql`
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
   * const result = database.insertAll(sql`
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
  public async insertAll<V, R = number>(query: string, values?: Partial<V>): Promise<Array<InsertResult<R>>> {
    const connection = await this.connect()

    try {
      return await connection.insertAll<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Inserts one row into the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The id of the inserted row
   *
   * @example
   * ```ts
   * const { id } = database.insertOne(sql`
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
  public async insertOne<V, R = number>(query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const connection = await this.connect()

    try {
      return await connection.insertOne<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Populates the database.
   *
   * Acquires a connection, populates the database and releases the connection.
   *
   * @param entities - The entities
   * @returns The ids of the inserted entities
   *
   * @example
   * ```ts
   * const result = database.populate({
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
    const connection = await this.connect()

    try {
      return await connection.populate<R>(entities)
    } finally {
      connection.release()
    }
  }

  /**
   * Executes any query against the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The query-specific result set
   */
  public async query<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const connection = await this.connect()

    try {
      return await connection.query<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Selects zero or one row from the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The selected row
   *
   * @example
   * ```ts
   * const result = database.select(sql`
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
  public async select<V, R>(query: string, values?: Partial<V>): Promise<R | undefined> {
    const connection = await this.connect()

    try {
      return await connection.select<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Selects multiple rows from the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The selected rows
   *
   * @example
   * ```ts
   * const result = database.selectAll(sql`
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
  public async selectAll<V, R>(query: string, values?: Partial<V>): Promise<R[]> {
    const connection = await this.connect()

    try {
      return await connection.selectAll<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Selects one row from the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The selected row
   * @throws zero rows were found
   *
   * @example
   * ```ts
   * const result = database.selectOne(sql`
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
  public async selectOne<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const connection = await this.connect()

    try {
      return await connection.selectOne<V, R>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Creates a stream of the selected rows.
   *
   * Acquires a connection, streams the rows and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The stream
   *
   * @example
   * ```ts
   * const reader = database.stream(sql`
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
  public async stream<V>(query: string, values?: Partial<V>): Promise<Readable> {
    const connection = await this.connect()
    const stream = connection.stream<V>(query, values)

    stream.once('close', () => {
      connection.release()
    })

    return stream
  }

  /**
   * Updates zero or more rows in the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @param values - The values
   * @returns The number of affected rows
   *
   * @example
   * ```ts
   * const { count } = database.update(sql`
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
  public async update<V>(query: string, values?: Partial<V>): Promise<UpdateResult> {
    const connection = await this.connect()

    try {
      return await connection.update<V>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Acquires a new connection to the database.
   */
  public abstract connect (): Promise<Connection>

  /**
   * Closes the connection pool.
   */
  public abstract end (): Promise<void>
}
