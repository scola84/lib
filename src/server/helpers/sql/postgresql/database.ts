import { Pool, types } from 'pg'
import { Database } from '../database'
import type { PoolConfig } from 'pg'
import { PostgresqlConnection } from './connection'
import { URL } from 'url'
import { format } from '../format'
import { format as formatValue } from './format'
import lodash from 'lodash'
import { parse } from 'query-string'
import tokens from './tokens'

types.setTypeParser(types.builtins.INT8, parseInt)

/**
 * Manages PostgreSQL connections.
 */
export class PostgresqlDatabase extends Database {
  public format = format(formatValue)

  public pool: Pool

  public tokens = tokens

  /**
   * Creates a PostgreSQL database.
   *
   * Parses the options with `parseDsn` if it is a string.
   *
   * @param options - The database options
   */
  public constructor (options: PoolConfig | string = {}) {
    super()

    const databaseOptions = typeof options === 'string'
      ? PostgresqlDatabase.parseDsn(options)
      : options

    this.pool = new Pool(databaseOptions)
  }

  /**
   * Creates pool options from a DSN (Data Source Name) of a PostgreSQL server.
   *
   * Adds `connectionString: dsn` and `connectionTimeoutMillis: 10000` to the pool options.
   *
   * Parses the query string of the DSN, casts booleans and numbers and adds the key/value pairs to the pool options.
   *
   * @param dsn - The DSN
   * @returns The pool options
   *
   * @example
   *
   * ```ts
   * const options = PostgresqlDatabase.parseDsn('mysql://root:root@localhost:3306/db?max=10')
   * // options = { connectionString: 'mysql://root:root@localhost:3306/db?max=10', connectionTimeoutMillis: 10000, max: 10 }
   * ```
   */
  public static parseDsn (dsn: string): PoolConfig {
    const url = new URL(dsn)

    const options: PoolConfig = {
      connectionString: dsn,
      connectionTimeoutMillis: 10000
    }

    Object
      .entries(parse(url.search, {
        parseBooleans: true,
        parseNumbers: true
      }))
      .forEach(([name, value]) => {
        lodash.set(options, name, value)
      })

    return options
  }

  public async connect (): Promise<PostgresqlConnection> {
    return new PostgresqlConnection(await this.pool.connect())
  }

  public async end (): Promise<void> {
    return this.pool.end()
  }
}
