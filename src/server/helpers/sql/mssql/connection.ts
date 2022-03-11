import type { IResult, Request } from 'mssql'
import type { SqlDeleteResult, SqlId, SqlInsertResult, SqlUpdateResult } from '../result'
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

  public async delete<Values>(string: string, values?: Partial<Values>): Promise<SqlDeleteResult> {
    const { rowsAffected } = await this.execute<Values, IResult<unknown>>({ string, values })

    const result = {
      count: rowsAffected[0]
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

  public async execute<Values, Result>(query: SqlQuery<Partial<Values>>): Promise<Result> {
    const result = await this.connection.query(this.formatter.formatQuery(query))
    return result as unknown as Result
  }

  public async insert<Values, Id = SqlId>(string: string, values?: Partial<Values>): Promise<SqlInsertResult<Id>> {
    const { recordset: [object] } = await this.execute<Values, IResult<{ id: Id }>>({
      string: sql`
        ${string};
        SELECT SCOPE_IDENTITY() AS id;
      `,
      values
    })

    return object
  }

  public async insertAll<Values, Id = SqlId>(string: string, values?: Partial<Values>): Promise<Array<SqlInsertResult<Id>>> {
    const { recordset } = await this.execute<Values, IResult<{ id: Id }>>({
      string: sql`
        ${string};
        SELECT SCOPE_IDENTITY() AS id;
      `,
      values
    })

    return recordset
  }

  public async insertOne<Values, Id = SqlId>(string: string, values?: Partial<Values>): Promise<SqlInsertResult<Id>> {
    const { recordset: [object] } = await this.execute<Values, IResult<{ id: Id }>>({
      string: sql`
        ${string};
        SELECT SCOPE_IDENTITY() AS id;
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

  public release (): void {
    this.connection.cancel()
  }

  public async select<Values, Result>(string: string, values?: Partial<Values>): Promise<Result | undefined> {
    const { recordset: [object] } = await this.execute<Values, IResult<Result>>({ string, values })
    return object
  }

  public async selectAll<Values, Result>(string: string, values?: Partial<Values>): Promise<Result[]> {
    const { recordset } = await this.execute<Values, IResult<Result>>({ string, values })
    return recordset
  }

  public async selectOne<Values, Result>(string: string, values?: Partial<Values>): Promise<Result> {
    const { recordset: [object] } = await this.execute<Values, IResult<Result>>({ string, values })

    if (object === undefined) {
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<Values>(string: string, values?: Partial<Values>): Readable {
    this.connection.stream = true

    const transform = new Transform({
      objectMode: true,
      transform (data, encoding, callback) {
        callback(null, data)
      }
    })

    this.connection.pipe(transform)
    // eslint-disable-next-line no-void
    void this.connection.query(this.formatter.formatQuery({ string, values }))
    return transform
  }

  public async update<Values>(string: string, values?: Partial<Values>): Promise<SqlUpdateResult> {
    const { rowsAffected } = await this.execute<Values, IResult<unknown>>({ string, values })

    const result = {
      count: rowsAffected[0]
    }

    return result
  }
}
