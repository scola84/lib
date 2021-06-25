import type { DeleteResult, InsertResult, UpdateResult } from '../connection'
import { Connection } from '../connection'
import PgQueryStream from 'pg-query-stream'
import type { PoolClient } from 'pg'
import type { Readable } from 'stream'
import { format } from '../format'
import { format as formatValue } from './format'

/**
 * Executes PostgreSQL queries.
 */
export class PostgresqlConnection extends Connection {
  public connection: PoolClient

  public format = format(formatValue)

  /**
   * Creates a PostgreSQL connection.
   *
   * @param connection - The underlying connection
   */
  public constructor (connection: PoolClient) {
    super()
    this.connection = connection
  }

  public async delete<Values>(query: string, values?: Partial<Values>): Promise<DeleteResult> {
    await this.query(query, values)
    return { count: 0 }
  }

  public async insert<Values, ID = number>(query: string, values?: Partial<Values>, key = 'id'): Promise<InsertResult<ID>> {
    const [object] = await this.query<Values, Array<InsertResult<ID>>>(`${query} RETURNING ${key} AS id`, values)
    return object
  }

  public async insertAll<Values, ID = number>(query: string, values?: Partial<Values>, key = 'id'): Promise<Array<InsertResult<ID>>> {
    return this.query<Values, Array<InsertResult<ID>>>(`${query} RETURNING ${key} AS id`, values)
  }

  public async insertOne<Values, ID = number>(query: string, values?: Partial<Values>, key = 'id'): Promise<InsertResult<ID>> {
    const [object] = await this.query<Values, Array<InsertResult<ID>>>(`${query} RETURNING ${key} AS id`, values)
    return object
  }

  public async query<Values, Result>(query: string, values?: Partial<Values>): Promise<Result> {
    const { rows } = await this.connection.query(this.format(query, values))
    return rows as unknown as Result
  }

  public release (): void {
    this.connection.release()
  }

  public async select<Values, Result>(query: string, values?: Partial<Values>): Promise<Result | undefined> {
    const [object] = await this.query<Values, Result[]>(query, values)
    return object
  }

  public async selectAll<Values, Result>(query: string, values?: Partial<Values>): Promise<Result[]> {
    return this.query<Values, Result[]>(query, values)
  }

  public async selectOne<Values, Result>(query: string, values?: Partial<Values>): Promise<Result> {
    const [object] = await this.query<Values, Result[]>(query, values)

    if (object === undefined) {
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<Values>(query: string, values?: Partial<Values>): Readable {
    return this.connection.query(new PgQueryStream(this.format(query, values)))
  }

  public async update<Values>(query: string, values?: Values): Promise<UpdateResult> {
    await this.query(query, values)
    return { count: 0 }
  }
}
