import { Pool, types } from 'pg'
import { Database } from '../database'
import type { PoolConfig } from 'pg'
import { PostgresqlConnection } from './connection'
import { URL } from 'url'
import { format } from '../format'
import { formatters } from './formatters'
import { parse } from 'query-string'
import { set } from '../../../../common'

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
      connectionString: url.toString(),
      connectionTimeoutMillis: 10000
    }

    Object
      .entries(parse(url.search, {
        parseBooleans: true,
        parseNumbers: true
      }))
      .forEach(([name, value]) => {
        set(options, name, value)
      })

    return new Pool(options)
  }
}
