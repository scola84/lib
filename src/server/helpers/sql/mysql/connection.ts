import type { DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise'
import type { Connection as BaseConnection } from 'mysql'
import { Connection } from '../connection'
import type { Readable } from 'stream'
import { format } from '../format'
import { format as formatValue } from './format'

interface StreamConnection extends PoolConnection {
  connection: BaseConnection
}

/**
 * Executes MySQL queries.
 */
export class MysqlConnection extends Connection {
  public connection: PoolConnection

  public format = format(formatValue)

  /**
   * Creates a MySQL connection.
   *
   * @param connection - The underlying connection
   */
  public constructor (connection: PoolConnection) {
    super()
    this.connection = connection
  }

  public async delete<Values>(query: string, values?: Partial<Values>): Promise<DeleteResult> {
    const result = await this.query<Values, ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }

  public async insert<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const result = await this.query<Values, { insertId: ID }>(query, values)
    return { id: result.insertId }
  }

  public async insertAll<Values, ID = number>(query: string, values?: Partial<Values>): Promise<Array<InsertResult<ID>>> {
    const result = await this.query<Values, { insertId: ID }>(query, values)
    return [{ id: result.insertId }]
  }

  public async insertOne<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const result = await this.query<Values, { insertId: ID }>(query, values)
    return { id: result.insertId }
  }

  public async query<Values, Result>(query: string, values?: Partial<Values>): Promise<Result> {
    const [result] = await this.connection.query(this.format(query, values))
    return result as unknown as Result
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
    return (this.connection as StreamConnection).connection
      .query(this.format(query, values))
      .stream()
  }

  public async update<Values>(query: string, values?: Partial<Values>): Promise<UpdateResult> {
    const result = await this.query<Values, ResultSetHeader>(query, values)
    return { count: result.affectedRows }
  }
}
