import { Pool, types } from 'pg'
import { Database } from '../database'
import type { PoolConfig } from 'pg'
import { PostgresqlConnection } from './connection'
import { URL } from 'url'
import { format } from '../format'
import { format as formatValue } from './format'
import lodash from 'lodash'
import { parse } from 'query-string'

types.setTypeParser(types.builtins.INT8, parseInt)

/**
 * Manages PostgreSQL connections.
 */
export class PostgresqlDatabase extends Database {
  public format = format(formatValue)

  public pool: Pool

  public async connect (): Promise<PostgresqlConnection> {
    return new PostgresqlConnection(await this.pool.connect())
  }

  public createPool (): Pool {
    const url = new URL(this.dsn ?? 'postgres://')

    url.password = this.password ?? url.password

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
        lodash.set(options, name, value)
      })

    return new Pool(options)
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
