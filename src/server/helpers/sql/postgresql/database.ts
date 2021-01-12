import { Database } from '../database'
import type { IConnectionParameters } from 'pg-promise/typescript/pg-subset'
import type { IDatabase } from 'pg-promise'
import { PostgresqlConnection } from './connection'
import { URL } from 'url'
import postgres from 'pg-promise'

export class PostgresqlDatabase extends Database {
  public readonly pool: IDatabase<unknown>

  public constructor (options: IConnectionParameters | string) {
    super()
    this.pool = postgres()(options)
  }

  public static parseDSN (dsn: string): IConnectionParameters {
    return {
      connectionString: dsn,
      ...Object.fromEntries(new URL(dsn).searchParams)
    }
  }

  public async connect (): Promise<PostgresqlConnection> {
    return new PostgresqlConnection(await this.pool.connect())
  }
}
