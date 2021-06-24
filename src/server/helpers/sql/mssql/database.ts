import { ConnectionPool } from 'mssql'
import { Database } from '../database'
import { MssqlConnection } from './connection'
import { URL } from 'url'
import type { config } from 'mssql'
import { format } from '../format'
import { format as formatValue } from './format'
import lodash from 'lodash'
import { parse } from 'query-string'

/**
 * Manages MSSQL connections.
 */
export class MssqlDatabase extends Database {
  public format = format(formatValue)

  public pool: ConnectionPool

  /**
   * Creates a MSSQL database.
   *
   * Parses the options with `parseDsn` if it is a string.
   *
   * @param options - The database options
   */
  public constructor (options: config | string = { server: '' }) {
    super()

    const databaseOptions = typeof options === 'string'
      ? MssqlDatabase.parseDsn(options)
      : options

    this.pool = new ConnectionPool(databaseOptions)
  }

  /**
   * Creates pool options from a DSN (Data Source Name) of a MSSQL server.
   *
   * Adds `options.encrypt: false` to the pool options.
   *
   * Parses the query string of the DSN, casts booleans and numbers and adds the key/value pairs to the pool options.
   *
   * @param dsn - The DSN
   * @returns The pool options
   *
   * @example
   *
   * ```ts
   * const options = MssqlDatabase.parseDsn('mssql://root:root@localhost:1433/db?connectionTimeout=10000')
   * // options = { connectionTimeout: 10000, database: 'db', options: { encrypt: false }, host: 'localhost', password: 'root', port: 1433, user: 'root' }
   * ```
   */
  public static parseDsn (dsn: string): config {
    const url = new URL(dsn)

    const options: config = {
      database: url.pathname.slice(1),
      options: {
        encrypt: false
      },
      password: decodeURIComponent(url.password),
      port: Number(url.port),
      server: url.hostname,
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

  public async connect (): Promise<MssqlConnection> {
    if (!this.pool.connected) {
      await this.pool.connect()
    }

    return new MssqlConnection(this.pool.request())
  }

  public async end (): Promise<void> {
    return this.pool.close()
  }
}
