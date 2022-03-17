import type { IResult, Request } from 'mssql'
import { MssqlFormatter } from './formatter'
import type { Readable } from 'stream'
import { SqlConnection } from '../connection'
import type { SqlQuery } from '../query'
import type { Struct } from '../../../../common'
import { Transform } from 'stream'
import { sql } from '../tag'

/**
 * Executes MSSQL queries.
 */
export class MssqlConnection extends SqlConnection {
  public connection: Request

  public formatter = new MssqlFormatter()

  /**
   * Creates a MSSQL connection.
   *
   * @param connection - The underlying connection
   */
  public constructor (connection: Request) {
    super()
    this.connection = connection
  }

  public async delete<Values = Struct>(string: string, values?: Partial<Values>): Promise<void> {
    await this.query<Values, IResult<unknown>>({
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
            FROM [${table}]
            WHERE ${
              Object
                .keys(object)
                .filter((column) => {
                  return column.endsWith('id')
                })
                .map((column) => {
                  return `[${column}] = $(${column})`
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
        ${query.string};
        SELECT SCOPE_IDENTITY() AS $[${key}];
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
        ${query.string};
        SELECT SCOPE_IDENTITY() AS $[${key}];
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
            SET IDENTITY_INSERT ${table} ON;
            INSERT INTO [${table}] (${
              Object
                .keys(object)
                .map((column) => {
                  return `[${column}]`
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
            SET IDENTITY_INSERT ${table} OFF;
          `, object)
        }))
      }))
  }

  public async query<Values = Struct, Result = Struct>(query: SqlQuery<Partial<Values>>): Promise<Result[]> {
    return (await this.connection.query<Result>(this.formatter.formatQuery(query))).recordset
  }

  public release (): void {
    this.connection.cancel()
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
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<Values = Struct>(string: string, values?: Partial<Values>): Readable {
    this.connection.stream = true

    const transform = new Transform({
      objectMode: true,
      transform: (data, encoding, callback) => {
        callback(null, data)
      }
    })

    this.connection.pipe(transform)

    // eslint-disable-next-line no-void
    void this.connection.query(this.formatter.formatQuery({
      string,
      values
    }))

    return transform
  }

  public async update<Values = Struct>(string: string, values?: Partial<Values>): Promise<void> {
    await this.query<Values, IResult<unknown>>({
      string,
      values
    })
  }
}
