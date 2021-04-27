import { Pool, types } from 'pg'
import { Database } from '../database'
import type { PoolConfig } from 'pg'
import { PostgresqlConnection } from './connection'
import { URL } from 'url'
import tokens from './tokens'

types.setTypeParser(20, parseInt)

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
      connectionString: dsn,
      ...Array
        .from(url.searchParams.entries())
        .reduce((entries: Record<string, string>, [key, value]: [string, string]) => {
          entries[key] = value
          return entries
        }, {})
    }

    return options
  }

  public async connect (): Promise<PostgresqlConnection> {
    return new PostgresqlConnection(await this.pool.connect())
  }
}
