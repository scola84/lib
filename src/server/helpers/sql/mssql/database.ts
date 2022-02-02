import { ConnectionPool } from 'mssql'
import { Database } from '../database'
import { MssqlConnection } from './connection'
import { URL } from 'url'
import { cast } from '../../../../common'
import type { config } from 'mssql'
import { format } from '../format'
import { formatters } from './formatters'
import { set } from 'lodash'

/**
 * Manages MSSQL connections.
 */
export class MssqlDatabase extends Database {
  public format = format(formatters)

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

      await this.pool.connect()

      if (this.population !== undefined) {
        await this.populate(this.population)
      }
    }
  }

  public async stop (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger?.info('Stopping database')
      await this.pool.close()
    }
  }

  protected parseDsn (dsn: string): config {
    const url = new URL(dsn)

    const options: config = {
      database: url.pathname.slice(1),
      port: Number(url.port),
      server: url.hostname,
      user: url.username
    }

    Array
      .from(url.searchParams.entries())
      .forEach(([name, value]) => {
        set(options, name, cast(value))
      })

    return options
  }
}
