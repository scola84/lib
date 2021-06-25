import type { DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { IResult, Request } from 'mssql'
import { Connection } from '../connection'
import type { Readable } from 'stream'
import { Transform } from 'stream'
import { format } from '../format'
import { format as formatValue } from './format'

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
    const result = await this.query<Values, IResult<unknown>>(query, values)
    return { count: result.rowsAffected[0] }
  }

  public async insert<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const { recordset: [object] } = await this.query<Values, IResult<{ id: ID }>>(`
      ${query};
      SELECT SCOPE_IDENTITY() AS id;
    `, values)

    return object
  }

  public async insertAll<Values, ID = number>(query: string, values?: Partial<Values>): Promise<Array<InsertResult<ID>>> {
    const { recordset } = await this.query<Values, IResult<{ id: ID }>>(`
      ${query};
      SELECT SCOPE_IDENTITY() AS id;
    `, values)

    return recordset
  }

  public async insertOne<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const { recordset: [object] } = await this.query<Values, IResult<{ id: ID }>>(`
      ${query};
      SELECT SCOPE_IDENTITY() AS id;
    `, values)

    return object
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
    const result = await this.query<Values, IResult<unknown>>(query, values)
    return { count: result.rowsAffected[0] }
  }
}
