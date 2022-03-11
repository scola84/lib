import type { SqlDeleteResult, SqlId, SqlInsertResult, SqlUpdateResult } from './result'
import type { Logger } from 'pino'
import type { Readable } from 'stream'
import type { SqlConnection } from './connection'
import type { SqlFormatter } from './formatter'
import type { SqlQuery } from './query'
import type { Struct } from '../../../common'

export interface SqlDatabaseOptions {
  /**
   * The DSN (Data Source Name) of the database server.
   */
  dsn?: string

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger?: Logger

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
export abstract class SqlDatabase {
  /**
   * The DSN (Data Source Name) of the database server.
   */
  public dsn?: string

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: Logger

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
   * The formatter.
   */
  public abstract formatter: SqlFormatter

  /**
   * The connection pool.
   */
  public abstract pool: unknown

  /**
   * Creates a database client.
   *
   * @param options - The database options
   */
  public constructor (options: SqlDatabaseOptions = {}) {
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
   * @param string - The SQL string
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
  public async delete<Values>(string: string, values?: Partial<Values>): Promise<SqlDeleteResult> {
    const connection = await this.connect()

    try {
      return await connection.delete<Values>(string, values)
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
   * Executes any query against the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param query - The query
   * @returns The query-specific result
   */
  public async execute<Values, Result>(query: SqlQuery<Values>): Promise<Result> {
    const connection = await this.connect()

    try {
      return await connection.execute<Values, Result>(query)
    } finally {
      connection.release()
    }
  }

  /**
   * Inserts one row into the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param string - The SQL string
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
  public async insert<Values, Id = SqlId>(string: string, values?: Partial<Values>): Promise<SqlInsertResult<Id>> {
    const connection = await this.connect()

    try {
      return await connection.insert<Values, Id>(string, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Inserts zero or more rows into the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param string - The SQL string
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
  public async insertAll<Values, Id = SqlId>(string: string, values?: Partial<Values>): Promise<Array< SqlInsertResult<Id>>> {
    const connection = await this.connect()

    try {
      return await connection.insertAll<Values, Id>(string, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Inserts one row into the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param string - The SQL string
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
  public async insertOne<Values, Id = SqlId>(string: string, values?: Partial<Values>): Promise<SqlInsertResult<Id>> {
    const connection = await this.connect()

    try {
      return await connection.insertOne<Values, Id>(string, values)
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
   * Selects zero or one row from the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param string - The SQL string
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
  public async select<Values, Result>(string: string, values?: Partial<Values>): Promise<Result | undefined> {
    const connection = await this.connect()

    try {
      return await connection.select<Values, Result>(string, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Selects multiple rows from the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param string - The SQL string
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
  public async selectAll<Values, Result>(string: string, values?: Partial<Values>): Promise<Result[]> {
    const connection = await this.connect()

    try {
      return await connection.selectAll<Values, Result>(string, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Selects one row from the database.
   *
   * Acquires a connection, executes the query and releases the connection.
   *
   * @param string - The SQL string
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
  public async selectOne<Values, Result>(string: string, values?: Partial<Values>): Promise<Result> {
    const connection = await this.connect()

    try {
      return await connection.selectOne<Values, Result>(string, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Creates a stream of the selected rows.
   *
   * Acquires a connection, streams the rows and releases the connection.
   *
   * @param string - The SQL string
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
  public async stream<Values>(string: string, values?: Partial<Values>): Promise<Readable> {
    const connection = await this.connect()
    const stream = connection.stream<Values>(string, values)

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
   * @param string - The SQL string
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
  public async update<Values>(string: string, values?: Partial<Values>): Promise<SqlUpdateResult> {
    const connection = await this.connect()

    try {
      return await connection.update<Values>(string, values)
    } finally {
      connection.release()
    }
  }

  /**
   * Acquires a new connection to the database.
   */
  public abstract connect (): Promise<SqlConnection>

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
