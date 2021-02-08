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
    const url = new URL(dsn)

    const options: IConnectionParameters = {
      connectionString: dsn
    }

    for (const [key, value] of url.searchParams.entries()) {
      options[key as keyof IConnectionParameters] = value
    }

    return options
  }

  public async connect (): Promise<PostgresqlConnection> {
    return new PostgresqlConnection(await this.pool.connect())
  }
}
