import type { Pool, PoolOptions } from 'mysql2/promise'
import { cast, isStruct } from '../../../../common'
import { Database } from '../database'
import { MysqlConnection } from './connection'
import { URL } from 'url'
import { createPool } from 'mysql2/promise'
import { format } from '../format'
import { formatters } from './formatters'
import { readFileSync } from 'fs-extra'
import { set } from 'lodash'

/**
 * Manages MySQL connections.
 */
export class MysqlDatabase extends Database {
  public format = format(formatters)

  public pool: Pool

  public async connect (): Promise<MysqlConnection> {
    return new MysqlConnection(await this.pool.getConnection())
  }

  public async start (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger = this.logger?.child({
        name: this.name
      })

      const options = this.parseDsn(this.dsn)

      this.logger?.info(options, 'Starting database')

      this.pool = createPool({
        ...options,
        password: this.password
      })

      if (this.population !== undefined) {
        await this.populate(this.population)
      }
    }
  }

  public async stop (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger?.info({}, 'Stopping database')
      await this.pool.end()
    }
  }

  protected parseDsn (dsn: string): PoolOptions {
    const url = new URL(dsn)

    const options: PoolOptions = {
      database: url.pathname.slice(1),
      decimalNumbers: true,
      host: url.hostname,
      port: 3306,
      supportBigNumbers: true,
      user: url.username
    }

    if (url.port !== '') {
      options.port = Number(url.port)
    }

    Array
      .from(url.searchParams.entries())
      .forEach(([name, value]) => {
        set(options, name, cast(value))
      })

    const sslNames = ['ca', 'cert', 'key']

    sslNames.forEach((name) => {
      if (isStruct(options.ssl)) {
        const value = options.ssl[name]

        if (typeof value === 'string') {
          options.ssl[name] = readFileSync(value)
        }
      }
    })

    return options
  }
}
