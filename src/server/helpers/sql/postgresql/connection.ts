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

  public async delete<V>(query: string, values?: Partial<V>): Promise<DeleteResult> {
    await this.query(query, values)
    return { count: 0 }
  }

  public async insert<V, R = number>(query: string, values?: Partial<V>, key = 'id'): Promise<InsertResult<R>> {
    const [object] = await this.query<V, Array<InsertResult<R>>>(`${query} RETURNING ${key} AS id`, values)
    return object
  }

  public async insertAll<V, R = number>(query: string, values?: Partial<V>, key = 'id'): Promise<Array<InsertResult<R>>> {
    return this.query<V, Array<InsertResult<R>>>(`${query} RETURNING ${key} AS id`, values)
  }

  public async insertOne<V, R = number>(query: string, values?: Partial<V>, key = 'id'): Promise<InsertResult<R>> {
    const [object] = await this.query<V, Array<InsertResult<R>>>(`${query} RETURNING ${key} AS id`, values)
    return object
  }

  public async query<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const { rows } = await this.connection.query(this.format(query, values))
    return rows as unknown as R
  }

  public release (): void {
    this.connection.release()
  }

  public async select<V, R>(query: string, values?: Partial<V>): Promise<R | undefined> {
    const [object] = await this.query<V, R[]>(query, values)
    return object
  }

  public async selectAll<V, R>(query: string, values?: Partial<V>): Promise<R[]> {
    return this.query<V, R[]>(query, values)
  }

  public async selectOne<V, R>(query: string, values?: Partial<V>): Promise<R> {
    const [object] = await this.query<V, R[]>(query, values)

    if (object === undefined) {
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<V>(query: string, values?: Partial<V>): Readable {
    return this.connection.query(new PgQueryStream(this.format(query, values)))
  }

  public async update<V>(query: string, values?: V): Promise<UpdateResult> {
    await this.query(query, values)
    return { count: 0 }
  }
}
