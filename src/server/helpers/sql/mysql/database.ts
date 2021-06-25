import type { Pool, PoolOptions } from 'mysql2/promise'
import { Database } from '../database'
import { MysqlConnection } from './connection'
import { URL } from 'url'
import { createPool } from 'mysql2/promise'
import { format } from '../format'
import { format as formatValue } from './format'
import lodash from 'lodash'
import { parse } from 'query-string'

/**
 * Manages MySQL connections.
 */
export class MysqlDatabase extends Database {
  public format = format(formatValue)

  public pool: Pool

  public async connect (): Promise<MysqlConnection> {
    return new MysqlConnection(await this.pool.getConnection())
  }

  public createPool (): Pool {
    const url = new URL(this.dsn ?? 'mysql://')

    const options: PoolOptions = {
      database: url.pathname.slice(1),
      decimalNumbers: true,
      host: url.hostname,
      password: this.password,
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

    return createPool(options)
  }

  public async start (): Promise<void> {
    this.pool = this.createPool()

    if (this.population !== undefined) {
      await this.populate(this.population)
    }
  }

  public async stop (): Promise<void> {
    await this.pool.end()
  }
}
