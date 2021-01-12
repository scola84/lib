import type { Pool, PoolOptions } from 'mysql2/promise'
import { Database } from '../database'
import { MysqlConnection } from './connection'
import { URL } from 'url'
import { createPool } from 'mysql2/promise'
import { unescape } from 'querystring'

export class MysqlDatabase extends Database {
  public readonly pool: Pool

  public constructor (options: PoolOptions) {
    super()
    this.pool = createPool(options)
  }

  public static parseDSN (dsn: string): PoolOptions {
    const url = new URL(dsn)

    return {
      database: url.pathname.slice(1),
      host: url.hostname,
      password: unescape(url.password),
      port: Number(url.port),
      user: url.username,
      ...Object.fromEntries(url.searchParams)
    }
  }

  public async connect (): Promise<MysqlConnection> {
    return new MysqlConnection(await this.pool.getConnection())
  }
}
