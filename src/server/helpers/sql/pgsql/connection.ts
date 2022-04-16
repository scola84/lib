import PgQueryStream from 'pg-query-stream'
import { PgsqlFormatter } from './formatter'
import type { PoolClient } from 'pg'
import type { Readable } from 'stream'
import { SqlConnection } from '../connection'
import type { SqlQuery } from '../query'
import type { Struct } from '../../../../common'
import { sql } from '../tag'

/**
 * Executes PgSQL queries.
 */
export class PgsqlConnection extends SqlConnection {
  public connection: PoolClient

  public formatter = new PgsqlFormatter()

  /**
   * Creates a PgSQL connection.
   *
   * @param connection - The underlying connection
   */
  public constructor (connection: PoolClient) {
    super()
    this.connection = connection
  }

  public async delete<Values = Struct>(string: string, values?: Values): Promise<void> {
    await this.query<Values>({
      string,
      values
    })
  }

  public async depopulate (population: Partial<Struct<Array<Partial<unknown>>>>): Promise<void> {
    await Promise.all(Object
      .entries(population as Struct<Array<Partial<unknown>>>)
      .map(async ([table, rows]) => {
        await Promise.all(rows.map(async (object) => {
          await this.delete(sql`
            DELETE
            FROM "${table}"
            WHERE ${
              Object
                .keys(object)
                .filter((column) => {
                  return column.endsWith('id')
                })
                .map((column) => {
                  return `"${column}" = $(${column})`
                })
                .join(' AND ')
            }
          `, object)
        }))
      }))
  }

  public async insert<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>, key: string | null = 'id'): Promise<Result> {
    const query = {
      string,
      values
    }

    if (key !== null) {
      query.string = sql`
        ${query.string}
        RETURNING $[${key}]
      `
    }

    const [object] = await this.query<Values, Result>(query)
    return object
  }

  public async insertAll<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>, key: string | null = 'id'): Promise<Result[]> {
    const query = {
      string,
      values
    }

    if (key !== null) {
      query.string = sql`
        ${query.string}
        RETURNING $[${key}]
      `
    }

    return this.query<Values, Result>(query)
  }

  public async populate (population: Partial<Struct<Array<Partial<unknown>>>>): Promise<void> {
    await Promise.all(Object
      .entries(population as Struct<Array<Partial<unknown>>>)
      .map(async ([table, rows]) => {
        await Promise.all(rows.map(async (object) => {
          await this.insert(sql`
            INSERT INTO "${table}" (${
              Object
                .keys(object)
                .map((column) => {
                  return `"${column}"`
                })
                .join(',')
            }) VALUES (${
              Object
                .keys(object)
                .map((column) => {
                  return `$(${column})`
                })
              .join(',')
            })
            ON CONFLICT DO NOTHING
          `, object)
        }))
      }))
  }

  public async query<Values = Struct, Result = Struct>(query: SqlQuery<Partial<Values>>): Promise<Result[]> {
    return (await this.connection.query<Result>(this.formatter.formatQuery(query))).rows
  }

  public release (): void {
    this.connection.release()
  }

  public async select<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result | undefined> {
    const [object] = await this.query<Values, Result>({
      string,
      values
    })

    return object
  }

  public async selectAll<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result[]> {
    return this.query<Values, Result>({
      string,
      values
    })
  }

  public async selectOne<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result> {
    const [object] = await this.query<Values, Result>({
      string,
      values
    })

    if (object === undefined) {
      throw new Error('Object is undefined')
    }

    return object
  }

  public stream<Values>(string: string, values?: Partial<Values>): Readable {
    return this.connection.query(new PgQueryStream(this.formatter.formatQuery({
      string,
      values
    })))
  }

  public async update<Values = Struct>(string: string, values?: Values): Promise<void> {
    await this.query<Values>({
      string,
      values
    })
  }
}
