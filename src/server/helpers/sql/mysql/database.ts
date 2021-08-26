import type { Pool, PoolOptions } from 'mysql2/promise'
import { Database } from '../database'
import { MysqlConnection } from './connection'
import { URL } from 'url'
import { createPool } from 'mysql2/promise'
import { format } from '../format'
import { formatters } from './formatters'
import { isObject } from '../../../../common'
import { parse } from 'query-string'
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
      this.pool = this.createPool(this.dsn, this.password)

      if (this.population !== undefined) {
        await this.populate(this.population)
      }
    }
  }

  public async stop (): Promise<void> {
    if (this.dsn !== undefined) {
      await this.pool.end()
    }
  }

  protected createPool (dsn: string, password?: string): Pool {
    const url = new URL(dsn)

    const options: PoolOptions = {
      database: url.pathname.slice(1),
      decimalNumbers: true,
      host: url.hostname,
      password,
      port: Number(url.port),
      supportBigNumbers: true,
      user: url.username
    }

    Object
      .entries(parse(url.search, {
        parseBooleans: true,
        parseNumbers: true
      }))
      .forEach(([name, value]) => {
        set(options, name, value)
      })

    const sslNames = ['ca', 'cert', 'key']

    sslNames.forEach((name) => {
      if (isObject(options.ssl)) {
        const value = options.ssl[name]

        if (typeof value === 'string') {
          options.ssl[name] = readFileSync(value)
        }
      }
    })

    return createPool(options)
  }
}
