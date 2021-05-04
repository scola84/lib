import { Pool, types } from 'pg'
import { Database } from '../database'
import type { PoolConfig } from 'pg'
import { PostgresqlConnection } from './connection'
import { URL } from 'url'
import lodash from 'lodash'
import tokens from './tokens'

types.setTypeParser(types.builtins.INT8, parseInt)

export class PostgresqlDatabase extends Database {
  public pool: Pool

  public tokens = tokens

  public constructor (rawOptions: PoolConfig | string = {}) {
    super()

    const options = typeof rawOptions === 'string'
      ? PostgresqlDatabase.parseDSN(rawOptions)
      : rawOptions

    this.pool = new Pool(options)
  }

  public static parseDSN (dsn: string): PoolConfig {
    const url = new URL(dsn)

    const options: PoolConfig = {
      connectionString: dsn
    }

    for (const [key, value] of url.searchParams.entries()) {
      lodash.set(options, key, JSON.parse(value))
    }

    return options
  }

  public async connect (): Promise<PostgresqlConnection> {
    return new PostgresqlConnection(await this.pool.connect())
  }

  public async end (): Promise<void> {
    return this.pool.end()
  }
}
