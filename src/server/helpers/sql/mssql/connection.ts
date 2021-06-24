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

  public async delete<V>(query: string, values?: Partial<V>): Promise<DeleteResult> {
    const result = await this.query<V, IResult<unknown>>(query, values)
    return { count: result.rowsAffected[0] }
  }

  public async insert<V, R = number>(query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const { recordset: [object] } = await this.query<V, IResult<{ id: R }>>(`
      ${query};
      SELECT SCOPE_IDENTITY() AS id;
    `, values)

    return object
  }

  public async insertAll<V, R = number>(query: string, values?: Partial<V>): Promise<Array<InsertResult<R>>> {
    const { recordset } = await this.query<V, IResult<{ id: R }>>(`
      ${query};
      SELECT SCOPE_IDENTITY() AS id;
    `, values)

    return recordset
  }

  public async insertOne<V, R = number>(query: string, values?: Partial<V>): Promise<InsertResult<R>> {
    const { recordset: [object] } = await this.query<V, IResult<{ id: R }>>(`
      ${query};
      SELECT SCOPE_IDENTITY() AS id;
    `, values)

    return object
  }

  public async query<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const result = await this.connection.query(this.format(query, values))
    return result as unknown as R
  }

  public release (): void {
    this.connection.cancel()
  }

  public async select<V, R>(query: string, values?: Partial<V>): Promise<R | undefined> {
    const { recordset: [object] } = await this.query<V, IResult<R>>(query, values)
    return object
  }

  public async selectAll<V, R>(query: string, values?: Partial<V>): Promise<R[]> {
    const { recordset } = await this.query<V, IResult<R>>(query, values)
    return recordset
  }

  public async selectOne<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const { recordset: [object] } = await this.query<V, IResult<R>>(query, values)

    if (object === undefined) {
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<V>(query: string, values?: Partial<V>): Readable {
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

  public async update<V>(query: string, values?: Partial<V>): Promise<UpdateResult> {
    const result = await this.query<V, IResult<unknown>>(query, values)
    return { count: result.rowsAffected[0] }
  }
}
