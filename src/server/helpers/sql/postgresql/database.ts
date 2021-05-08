import { Pool, types } from 'pg'
import { Database } from '../database'
import type { PoolConfig } from 'pg'
import { PostgresqlConnection } from './connection'
import { URL } from 'url'
import lodash from 'lodash'
import { parse } from 'query-string'
import tokens from './tokens'

types.setTypeParser(types.builtins.INT8, parseInt)

export class PostgresqlDatabase extends Database {
  public pool: Pool

  public tokens = tokens

  public constructor (rawOptions: PoolConfig | string = {}) {
    super()

    const options = typeof rawOptions === 'string'
      ? PostgresqlDatabase.parseDsn(rawOptions)
      : rawOptions

    this.pool = new Pool(options)
  }

  public static parseDsn (dsn: string): PoolConfig {
    const url = new URL(dsn)

    const options: PoolConfig = {
      connectionString: dsn,
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

    return options
  }

  public async connect (): Promise<PostgresqlConnection> {
    return new PostgresqlConnection(await this.pool.connect())
  }

  public async end (): Promise<void> {
    return this.pool.end()
  }
}
