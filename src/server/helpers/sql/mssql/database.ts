import { ConnectionPool } from 'mssql'
import { Database } from '../database'
import { MssqlConnection } from './connection'
import { URL } from 'url'
import type { config } from 'mssql'
import lodash from 'lodash'
import { parse } from 'query-string'
import tokens from './tokens'

export class MssqlDatabase extends Database {
  public pool: ConnectionPool

  public tokens = tokens

  public constructor (rawOptions: config | string = { server: '' }) {
    super()

    const options = typeof rawOptions === 'string'
      ? MssqlDatabase.parseDsn(rawOptions)
      : rawOptions

    this.pool = new ConnectionPool(options)
  }

  public static parseDsn (dsn: string): config {
    const url = new URL(dsn)

    const options: config = {
      database: url.pathname.slice(1),
      options: {
        encrypt: false
      },
      password: decodeURIComponent(url.password),
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
        lodash.set(options, name, value)
      })

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
