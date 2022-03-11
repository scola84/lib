import type { SqlDeleteResult, SqlId, SqlInsertResult, SqlUpdateResult } from '../result'
import PgQueryStream from 'pg-query-stream'
import type { PoolClient } from 'pg'
import { PostgresqlFormatter } from './formatter'
import type { Readable } from 'stream'
import { SqlConnection } from '../connection'
import type { SqlQuery } from '../query'
import type { Struct } from '../../../../common'
import { sql } from '../tag'

/**
 * Executes PostgreSQL queries.
 */
export class PostgresqlConnection extends SqlConnection {
  public connection: PoolClient

  public formatter = new PostgresqlFormatter()

  /**
   * Creates a PostgreSQL connection.
   *
   * @param connection - The underlying connection
   */
  public constructor (connection: PoolClient) {
    super()
    this.connection = connection
  }

  public async delete<Values>(string: string, values?: Partial<Values>): Promise<SqlDeleteResult> {
    await this.execute({ string, values })

    const result = {
      count: 0
    }

    return result
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

  public async execute<Values, Result>(query: SqlQuery<Partial<Values>>): Promise<Result> {
    const { rows } = await this.connection.query(this.formatter.formatQuery(query))
    return rows as unknown as Result
  }

  public async insert<Values, Id = SqlId>(string: string, values?: Partial<Values>, key = 'id'): Promise<SqlInsertResult<Id>> {
    const [object] = await this.execute<Values, Array<SqlInsertResult<Id>>>({
      string: sql`
        ${string}
        RETURNING ${key} AS id
      `,
      values
    })

    return object
  }

  public async insertAll<Values, Id = SqlId>(string: string, values?: Partial<Values>, key = 'id'): Promise<Array<SqlInsertResult<Id>>> {
    return this.execute<Values, Array<SqlInsertResult<Id>>>({
      string: sql`
        ${string}
        RETURNING ${key} AS id
      `,
      values
    })
  }

  public async insertOne<Values, Id = SqlId>(string: string, values?: Partial<Values>, key = 'id'): Promise<SqlInsertResult<Id>> {
    const [object] = await this.execute<Values, Array<SqlInsertResult<Id>>>({
      string: sql`
        ${string}
        RETURNING ${key} AS id
      `,
      values
    })

    return object
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

  public release (): void {
    this.connection.release()
  }

  public async select<Values, Result>(string: string, values?: Partial<Values>): Promise<Result | undefined> {
    const [object] = await this.execute<Values, Result[]>({ string, values })
    return object
  }

  public async selectAll<Values, Result>(string: string, values?: Partial<Values>): Promise<Result[]> {
    return this.execute<Values, Result[]>({ string, values })
  }

  public async selectOne<Values, Result>(string: string, values?: Partial<Values>): Promise<Result> {
    const [object] = await this.execute<Values, Result[]>({ string, values })

    if (object === undefined) {
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<Values>(string: string, values?: Partial<Values>): Readable {
    return this.connection.query(new PgQueryStream(this.formatter.formatQuery({ string, values })))
  }

  public async update<Values>(string: string, values?: Values): Promise<SqlUpdateResult> {
    await this.execute({ string, values })

    const result = {
      count: 0
    }

    return result
  }
}
