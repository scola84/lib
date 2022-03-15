import type { PoolClient, QueryResult } from 'pg'
import PgQueryStream from 'pg-query-stream'
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

  public async delete<Values = Struct>(string: string, values?: Values): Promise<Values | undefined> {
    await this.execute<Values>({
      string,
      values
    })

    return values
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

  public async execute<Values = Struct, Result = Struct>(query: SqlQuery<Partial<Values>>): Promise<QueryResult<Result>> {
    return this.connection.query(this.formatter.formatQuery(query))
  }

  public async insert<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>, key = 'id'): Promise<Result> {
    const { rows: [object] } = await this.execute<Values, Result>({
      string: sql`
        ${string}
        RETURNING $[${key}]
      `,
      values: values
    })

    return {
      ...values,
      ...object
    }
  }

  public async insertAll<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>, key = 'id'): Promise<Result[]> {
    const { rows } = await this.execute<Values, Result>({
      string: sql`
        ${string}
        RETURNING $[${key}]
      `,
      values: values
    })

    return rows
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

  public async select<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result | undefined> {
    const { rows: [object] } = await this.execute<Values, Result>({
      string,
      values
    })

    return object
  }

  public async selectAll<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result[]> {
    const { rows } = await this.execute<Values, Result>({
      string,
      values
    })

    return rows
  }

  public async selectOne<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result> {
    const { rows: [object] } = await this.execute<Values, Result>({
      string,
      values
    })

    if (object === undefined) {
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<Values>(string: string, values?: Partial<Values>): Readable {
    return this.connection.query(new PgQueryStream(this.formatter.formatQuery({
      string,
      values
    })))
  }

  public async update<Values = Struct>(string: string, values?: Values): Promise<Partial<Values> | undefined> {
    await this.execute<Values>({
      string,
      values
    })

    return values
  }
}
