import { Pool, types } from 'pg'
import { Database } from '../database'
import type { PoolConfig } from 'pg'
import { PostgresqlConnection } from './connection'
import { URL } from 'url'
import { format } from '../format'
import { formatters } from './formatters'
import { isStruct } from '../../../../common'
import { parse } from 'query-string'
import { readFileSync } from 'fs-extra'
import { set } from 'lodash'

types.setTypeParser(types.builtins.INT8, parseInt)

/**
 * Manages PostgreSQL connections.
 */
export class PostgresqlDatabase extends Database {
  public format = format(formatters)

  public pool: Pool

  public async connect (): Promise<PostgresqlConnection> {
    return new PostgresqlConnection(await this.pool.connect())
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

    url.password = String(password)

    const options: PoolConfig = {
      connectionTimeoutMillis: 10000,
      database: url.pathname.slice(1),
      host: url.hostname,
      password,
      port: Number(url.port),
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
      if (isStruct(options.ssl)) {
        const value = options.ssl[name]

        if (typeof value === 'string') {
          options.ssl[name] = readFileSync(value)
        }
      }
    })

    return new Pool(options)
  }
}
