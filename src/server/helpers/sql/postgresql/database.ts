import { Pool, types } from 'pg'
import { cast, isStruct } from '../../../../common'
import type { PoolConfig } from 'pg'
import { PostgresqlConnection } from './connection'
import { PostgresqlFormatter } from './formatter'
import { SqlDatabase } from '../database'
import { URL } from 'url'
import { readFileSync } from 'fs-extra'
import { set } from 'lodash'

types.setTypeParser(types.builtins.INT8, parseInt)

/**
 * Manages PostgreSQL connections.
 */
export class PostgresqlDatabase extends SqlDatabase {
  public formatter = new PostgresqlFormatter()

  public pool: Pool

  public async connect (): Promise<PostgresqlConnection> {
    return new PostgresqlConnection(await this.pool.connect())
  }

  public async start (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger = this.logger?.child({
        name: this.name
      })

      const options = this.parseDsn(this.dsn)

      this.logger?.info(options, 'Starting database')

      this.pool = new Pool({
        ...options,
        password: this.password
      })

      this.pool.on('error', (error) => {
        this.logger?.error({
          context: 'pool'
        }, String(error))
      })

      if (this.population !== undefined) {
        await this.populate(this.population)
      }
    }
  }

  public async stop (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger?.info({}, 'Stopping database')
      this.pool.removeAllListeners()
      await this.pool.end()
    }
  }

  protected parseDsn (dsn: string): PoolConfig {
    const url = new URL(dsn)

    const options: PoolConfig = {
      connectionTimeoutMillis: 10000,
      database: url.pathname.slice(1),
      host: url.hostname,
      port: 5432,
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
