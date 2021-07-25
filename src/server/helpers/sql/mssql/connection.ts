import type { DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { IResult, Request } from 'mssql'
import { Connection } from '../connection'
import type { Readable } from 'stream'
import { Transform } from 'stream'
import { format } from '../format'
import { format as formatValue } from './format'
import { sql } from '../tag'

/**
 * Executes MSSQL queries.
 */
export class MssqlConnection extends Connection {
  public connection: Request

  public format = format(formatValue)

  /**
   * Creates a MSSQL connection.
   *
   * @param connection - The underlying connection
   */
  public constructor (connection: Request) {
    super()
    this.connection = connection
  }

  public async delete<Values>(query: string, values?: Partial<Values>): Promise<DeleteResult> {
    const { rowsAffected } = await this.query<Values, IResult<unknown>>(query, values)

    const result = {
      count: rowsAffected[0]
    }

    return result
  }

  public async depopulate (population: Partial<Record<string, Array<Partial<unknown>>>>): Promise<void> {
    await Promise.all(Object
      .entries(population as Record<string, Array<Partial<unknown>>>)
      .map(async ([table, rows]) => {
        return Promise.all(rows.map(async (object) => {
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

  public async insert<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const { recordset: [object] } = await this.query<Values, IResult<{ id: ID }>>(sql`
      ${query};
      SELECT SCOPE_IDENTITY() AS id;
    `, values)

    return object
  }

  public async insertAll<Values, ID = number>(query: string, values?: Partial<Values>): Promise<Array<InsertResult<ID>>> {
    const { recordset } = await this.query<Values, IResult<{ id: ID }>>(sql`
      ${query};
      SELECT SCOPE_IDENTITY() AS id;
    `, values)

    return recordset
  }

  public async insertOne<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const { recordset: [object] } = await this.query<Values, IResult<{ id: ID }>>(sql`
      ${query};
      SELECT SCOPE_IDENTITY() AS id;
    `, values)

    return object
  }

  public async populate (population: Partial<Record<string, Array<Partial<unknown>>>>): Promise<void> {
    await Promise.all(Object
      .entries(population as Record<string, Array<Partial<unknown>>>)
      .map(async ([table, rows]) => {
        return Promise.all(rows.map(async (object) => {
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

  public async query<Values, Result>(query: string, values?: Partial<Values>): Promise<Result> {
    const result = await this.connection.query(this.format(query, values))
    return result as unknown as Result
  }

  public release (): void {
    this.connection.cancel()
  }

  public async select<Values, Result>(query: string, values?: Partial<Values>): Promise<Result | undefined> {
    const { recordset: [object] } = await this.query<Values, IResult<Result>>(query, values)
    return object
  }

  public async selectAll<Values, Result>(query: string, values?: Partial<Values>): Promise<Result[]> {
    const { recordset } = await this.query<Values, IResult<Result>>(query, values)
    return recordset
  }

  public async selectOne<Values, Result>(query: string, values?: Partial<Values>): Promise<Result> {
    const { recordset: [object] } = await this.query<Values, IResult<Result>>(query, values)

    if (object === undefined) {
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<Values>(query: string, values?: Partial<Values>): Readable {
    this.connection.stream = true

    const transform = new Transform({
      objectMode: true,
      transform (chunk, encoding, callback) {
        callback(null, chunk)
      }
    })

    this.connection.pipe(transform)
    // eslint-disable-next-line no-void
    void this.connection.query(this.format(query, values))
    return transform
  }

  public async update<Values>(query: string, values?: Partial<Values>): Promise<UpdateResult> {
    const { rowsAffected } = await this.query<Values, IResult<unknown>>(query, values)

    const result = {
      count: rowsAffected[0]
    }

    return result
  }
}
