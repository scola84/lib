import { Pool, types } from 'pg'
import { cast, isStruct, set, toString } from '../../../../common'
import { PgsqlConnection } from './connection'
import { PgsqlFormatter } from './formatter'
import type { PoolConfig } from 'pg'
import { SqlDatabase } from '../database'
import { URL } from 'url'
import { readFileSync } from 'fs-extra'

types.setTypeParser(types.builtins.INT8, parseInt)

/**
 * Manages PgSQL connections.
 */
export class PgsqlDatabase extends SqlDatabase {
  public formatter = new PgsqlFormatter()

  public pool: Pool

  public async connect (): Promise<PgsqlConnection> {
    return new PgsqlConnection(await this.pool.connect())
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
        }, toString(error))
      })

      if (this.population !== undefined) {
        await this.populate(this.population)
      }
    }
  }

  public async stop (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger?.info({
        idleCount: this.pool.idleCount,
        totalCount: this.pool.totalCount,
        waitingCount: this.pool.waitingCount
      }, 'Stopping database')

      this.pool.removeAllListeners()
      await this.pool.end()
      this.logger?.info('Stopped database')
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