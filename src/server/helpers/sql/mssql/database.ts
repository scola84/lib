import { cast, set } from '../../../../common'
import { ConnectionPool } from 'mssql'
import { MssqlConnection } from './connection'
import { MssqlFormatter } from './formatter'
import { SqlDatabase } from '../database'
import { URL } from 'url'
import type { config } from 'mssql'

/**
 * Manages MSSQL connections.
 */
export class MssqlDatabase extends SqlDatabase {
  public formatter = new MssqlFormatter()

  public pool: ConnectionPool

  public async connect (): Promise<MssqlConnection> {
    return Promise.resolve(new MssqlConnection(this.pool.request()))
  }

  public async start (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger = this.logger?.child({
        name: this.name
      })

      const options = this.parseDsn(this.dsn)

      this.logger?.info(options, 'Starting database')

      this.pool = new ConnectionPool({
        ...options,
        password: this.password
      })

      this.pool.on('error', (error) => {
        this.logger?.error({
          context: 'pool'
        }, String(error))
      })

      await this.pool.connect()

      if (this.population !== undefined) {
        await this.populate(this.population)
      }
    }
  }

  public async stop (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger?.info({}, 'Stopping database')
      this.pool.removeAllListeners()
      await this.pool.close()
    }
  }

  protected parseDsn (dsn: string): config {
    const url = new URL(dsn)

    const options: config = {
      database: url.pathname.slice(1),
      port: 1433,
      server: url.hostname,
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

    return options
  }
}
