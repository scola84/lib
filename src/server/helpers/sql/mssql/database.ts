import { ConnectionPool } from 'mssql'
import { Database } from '../database'
import { MssqlConnection } from './connection'
import { URL } from 'url'
import type { config } from 'mssql'
import { format } from '../format'
import { format as formatValue } from './format'
import { parse } from 'query-string'
import { set } from '../../../../common'

/**
 * Manages MSSQL connections.
 */
export class MssqlDatabase extends Database {
  public format = format(formatValue)

  public pool: ConnectionPool

  public async connect (): Promise<MssqlConnection> {
    return Promise.resolve(new MssqlConnection(this.pool.request()))
  }

  public createPool (): ConnectionPool {
    const url = new URL(this.dsn ?? 'mssql://')

    const options: config = {
      database: url.pathname.slice(1),
      options: {
        encrypt: false
      },
      password: this.password,
      port: Number(url.port),
      server: url.hostname,
      user: decodeURIComponent(url.username)
    }

    Object
      .entries(parse(url.search, {
        parseBooleans: true,
        parseNumbers: true
      }))
      .forEach(([name, value]) => {
        set(options, name, value)
      })

    return new ConnectionPool(options)
  }

  public async start (): Promise<void> {
    this.pool = this.createPool()
    await this.pool.connect()

    if (this.population !== undefined) {
      await this.populate(this.population)
    }
  }

  public async stop (): Promise<void> {
    await this.pool.close()
  }
}
