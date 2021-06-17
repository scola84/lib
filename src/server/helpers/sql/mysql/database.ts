import type { Pool, PoolOptions } from 'mysql2/promise'
import { Database } from '../database'
import { MysqlConnection } from './connection'
import { URL } from 'url'
import { createPool } from 'mysql2/promise'
import { format } from '../format'
import { format as formatValue } from './format'
import lodash from 'lodash'
import { parse } from 'query-string'
import tokens from './tokens'

/**
 * Manages MySQL connections.
 */
export class MysqlDatabase extends Database {
  public format = format(formatValue)

  public pool: Pool

  public tokens = tokens

  /**
   * Constructs a MySQL database.
   *
   * Parses the options with `parseDsn` if it is a string.
   *
   * @param options - The database options
   */
  public constructor (options: PoolOptions | string = {}) {
    super()

    const databaseOptions = typeof options === 'string'
      ? MysqlDatabase.parseDsn(options)
      : options

    this.pool = createPool(databaseOptions)
  }

  /**
   * Constructs pool options from a DSN (Data Source Name) of a MySQL server.
   *
   * Adds `decimalNumbers: true` and `supportBigNumbers: true` to the pool options.
   *
   * Parses the query string of the DSN, casts booleans and numbers and adds the key/value pairs to the pool options.
   *
   * @param dsn - The DSN
   * @returns The pool options
   *
   * @example
   *
   * ```ts
   * const options = MysqlDatabase.parseDSN('mysql://root:root@localhost:3306/db?nestTables=1')
   * // options = { database: 'db', decimalNumbers: true, host: 'localhost', password: 'root', nestTables: true, port: 3306, supportBigNumbers: true, user: 'root' }
   * ```
   */
  public static parseDsn (dsn: string): PoolOptions {
    const url = new URL(dsn)

    const options: PoolOptions = {
      database: url.pathname.slice(1),
      decimalNumbers: true,
      host: url.hostname,
      password: decodeURIComponent(url.password),
      port: Number(url.port),
      supportBigNumbers: true,
      user: decodeURIComponent(url.username)
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

  public async connect (): Promise<MysqlConnection> {
    return new MysqlConnection(await this.pool.getConnection())
  }

  public async end (): Promise<void> {
    return this.pool.end()
  }
}
