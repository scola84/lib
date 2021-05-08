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

export class MysqlDatabase extends Database {
  public format = format(formatValue)

  public pool: Pool

  public tokens = tokens

  public constructor (rawOptions: PoolOptions | string = {}) {
    super()

    const options = typeof rawOptions === 'string'
      ? MysqlDatabase.parseDsn(rawOptions)
      : rawOptions

    this.pool = createPool(options)
  }

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
