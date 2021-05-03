import { ConnectionPool } from 'mssql'
import { Database } from '../database'
import { MssqlConnection } from './connection'
import { URL } from 'url'
import type { config } from 'mssql'
import lodash from 'lodash'
import tokens from './tokens'

export class MssqlDatabase extends Database {
  public pool: ConnectionPool

  public tokens = tokens

  public constructor (rawOptions: config | string = { server: '' }) {
    super()

    const options = typeof rawOptions === 'string'
      ? MssqlDatabase.parseDSN(rawOptions)
      : rawOptions

    this.pool = new ConnectionPool(options)
  }

  public static parseDSN (dsn: string): config {
    const url = new URL(dsn)

    const options: config = {
      database: url.pathname.slice(1),
      options: {
        enableArithAbort: true
      },
      password: unescape(url.password),
      port: Number(url.port),
      server: url.hostname,
      user: url.username
    }

    for (const [key, value] of url.searchParams.entries()) {
      lodash.set(options, key, JSON.parse(value))
    }

    return options
  }

  public async connect (): Promise<MssqlConnection> {
    if (!this.pool.connected) {
      await this.pool.connect()
    }

    return new MssqlConnection(this.pool.request())
  }

  public async end (): Promise<void> {
    return this.pool.close()
  }
}
