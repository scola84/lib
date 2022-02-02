import type { Connection, DeleteResult, InsertResult, UpdateResult } from './connection'
import type { Readable } from 'stream'
import type { Struct } from '../../../common'
import type pino from 'pino'

export interface DatabaseOptions {
  /**
   * The DSN (Data Source Name) of the database server.
   */
  dsn?: string

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger?: pino.Logger

  /**
   * The name of the database.
   */
  name?: string

  /**
   * The password of the database server.
   */
  password?: string

  /**
   * The population to add to the database at startup.
   */
  population?: Partial<Struct<Array<Partial<unknown>>>>
}

/**
 * Manages database connections.
 */
export abstract class Database {
  /**
   * The DSN (Data Source Name) of the database server.
   */
  public dsn?: string

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: pino.Logger

  /**
   * The name of the database.
   */
  public name?: string

  /**
   * The password of the database server.
   */
  public password?: string

  /**
   * The population to add to the database at startup.
   */
  public population?: Partial<Struct<Array<Partial<unknown>>>>

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
   * const query = database.format(sql`
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
   * const query = database.format(sql`
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
  public abstract format: (query: string, values: Struct) => string

  /**
   * The connection pool.
   */
  public abstract pool: unknown

  /**
   * Creates a database client.
   *
   * @param options - The database options
   */
  public constructor (options: DatabaseOptions = {}) {
    this.dsn = options.dsn
    this.logger = options.logger
    this.name = options.name
    this.password = options.password
    this.population = options.population
  }

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
   * console.log(count) // count = 1 if there is one row with c1 = v1
   * ```
   */
  public async delete<Values>(query: string, values?: Partial<Values>): Promise<DeleteResult> {
    const connection = await this.connect()

    try {
      return await connection.delete<Values>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Depopulates the database.
   *
   * Acquires a connection, depopulates the database and releases the connection.
   *
   * @param population - The population
   *
   * @example
   * ```ts
   * database.depopulate({
   *   t1: [{
   *     c1: 'v1'
   *   }, {
   *     c1: 'v2'
   *   }]
   * })
   * ```
   */
  public async depopulate (population: Partial<Struct<Array<Partial<unknown>>>>): Promise<void> {
    const connection = await this.connect()

    try {
      await connection.depopulate(population)
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
   * console.log(id) // id = 1
   * ```
   */
  public async insert<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const connection = await this.connect()

    try {
      return await connection.insert<Values, ID>(query, values)
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
   * console.log(result) // result = [{ id: 1 }]
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
   * console.log(result) // result = [{ id: 1 }, { id: 2 }]
   * ```
   */
  public async insertAll<Values, ID = number>(query: string, values?: Partial<Values>): Promise<Array<InsertResult<ID>>> {
    const connection = await this.connect()

    try {
      return await connection.insertAll<Values, ID>(query, values)
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
   * console.log(id) // id = 1
   * ```
   */
  public async insertOne<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const connection = await this.connect()

    try {
      return await connection.insertOne<Values, ID>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Populates the database.
   *
   * Acquires a connection, populates the database and releases the connection.
   *
   * @param population - The population
   *
   * @example
   * ```ts
   * database.populate({
   *   t1: [{
   *     c1: 'v1'
   *   }, {
   *     c1: 'v2'
   *   }]
   * })
   * ```
   */
  public async populate (population: Partial<Struct<Array<Partial<unknown>>>>): Promise<void> {
    const connection = await this.connect()

    try {
      await connection.populate(population)
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
  public async query<Values, Result>(query: string, values?: Partial<Values>): Promise<Result> {
    const connection = await this.connect()

    try {
      return await connection.query<Values, Result>(query, values)
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
   * console.log(result) // result = { id: 1, c1: 'v1' }
   * ```
   */
  public async select<Values, Result>(query: string, values?: Partial<Values>): Promise<Result | undefined> {
    const connection = await this.connect()

    try {
      return await connection.select<Values, Result>(query, values)
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
   * console.log(result) // result = [{ id: 1, c1: 'v1' }]
   * ```
   */
  public async selectAll<Values, Result>(query: string, values?: Partial<Values>): Promise<Result[]> {
    const connection = await this.connect()

    try {
      return await connection.selectAll<Values, Result>(query, values)
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
   * console.log(result) // result = { id: 1, c1: 'v1' }
   * ```
   */
  public async selectOne<Values, Result>(query: string, values?: Partial<Values>): Promise<Result> {
    const connection = await this.connect()

    try {
      return await connection.selectOne<Values, Result>(query, values)
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
   *   console.log(row) // row = { id: 1, c1: 'v1' }
   * })
   * ```
   */
  public async stream<Values>(query: string, values?: Partial<Values>): Promise<Readable> {
    const connection = await this.connect()
    const stream = connection.stream<Values>(query, values)

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
   * console.log(count) // count = 1
   * ```
   */
  public async update<Values>(query: string, values?: Partial<Values>): Promise<UpdateResult> {
    const connection = await this.connect()

    try {
      return await connection.update<Values>(query, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Acquires a new connection to the database.
   */
  public abstract connect (): Promise<Connection>

  /**
   * Starts the database client.
   *
   * Sets `pool` and populates the database if `dsn` is defined.
   */
  public abstract start (): Promise<void>

  /**
   * Stops the database client if `dsn` is defined.
   *
   * Closes the pool.
   */
  public abstract stop (): Promise<void>

  /**
   * Parses `dsn` as the pool options.
   *
   * Adds dialect-specific default values to the pool options.
   *
   * Parses the query string of `dsn`, casts boolean and number values and adds the key/value pairs to the pool options.
   *
   * @param dsn - The DSN of the pool
   * @returns The pool options
   */
  protected abstract parseDsn (dsn: string): unknown
}
