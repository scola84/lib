import type { Pool, PoolOptions } from 'mysql2/promise'
import { Database } from '../database'
import { MysqlConnection } from './connection'
import { URL } from 'url'
import { createPool } from 'mysql2/promise'
import lodash from 'lodash'
import tokens from './tokens'
import { unescape } from 'querystring'

export class MysqlDatabase extends Database {
  public pool: Pool

  public tokens = tokens

  public constructor (rawOptions: PoolOptions | string = {}) {
    super()

    const options = typeof rawOptions === 'string'
      ? MysqlDatabase.parseDSN(rawOptions)
      : rawOptions

    this.pool = createPool({
      supportBigNumbers: true,
      ...options
    })
  }

  public static parseDSN (dsn: string): PoolOptions {
    const url = new URL(dsn)

    const options: PoolOptions = {
      database: url.pathname.slice(1),
      host: url.hostname,
      password: unescape(url.password),
      port: Number(url.port),
      user: url.username
    }

    for (const [key, value] of url.searchParams.entries()) {
      lodash.set(options, key, JSON.parse(value))
    }

    return options
  }

  public async connect (): Promise<MysqlConnection> {
    return new MysqlConnection(await this.pool.getConnection())
  }

  public async end (): Promise<void> {
    return this.pool.end()
  }
}
