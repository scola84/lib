import type { DeleteResult, InsertResult, UpdateResult } from '../connection'
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise'
import type { Connection as BaseConnection } from 'mysql'
import { Connection } from '../connection'
import type { Readable } from 'stream'
import type { Struct } from '../../../../common'
import { format } from '../format'
import { formatters } from './formatters'
import { sql } from '../tag'

interface StreamConnection extends PoolConnection {
  connection: BaseConnection
}

/**
 * Executes MySQL queries.
 */
export class MysqlConnection extends Connection {
  public connection: PoolConnection

  public format = format(formatters)

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
    const { affectedRows } = await this.query<Values, ResultSetHeader>(query, values)

    const result = {
      count: affectedRows
    }

    return result
  }

  public async depopulate (population: Partial<Struct<Array<Partial<unknown>>>>): Promise<void> {
    await Promise.all(Object
      .entries(population as Struct<Array<Partial<unknown>>>)
      .map(async ([table, rows]) => {
        return Promise.all(rows.map(async (object) => {
          await this.delete(sql`
            DELETE
            FROM \`${table}\`
            WHERE ${
              Object
                .keys(object)
                .filter((column) => {
                  return column.endsWith('id')
                })
                .map((column) => {
                  return `\`${column}\` = $(${column})`
                })
                .join(' AND ')
            }
          `, object)
        }))
      }))
  }

  public async insert<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const { insertId } = await this.query<Values, { insertId: ID }>(query, values)

    const result = {
      id: insertId
    }

    return result
  }

  public async insertAll<Values, ID = number>(query: string, values?: Partial<Values>): Promise<Array<InsertResult<ID>>> {
    const { insertId } = await this.query<Values, { insertId: ID }>(query, values)

    const result = [{
      id: insertId
    }]

    return result
  }

  public async insertOne<Values, ID = number>(query: string, values?: Partial<Values>): Promise<InsertResult<ID>> {
    const { insertId } = await this.query<Values, { insertId: ID }>(query, values)

    const result = {
      id: insertId
    }

    return result
  }

  public async populate (population: Partial<Struct<Array<Partial<unknown>>>>): Promise<void> {
    await Promise.all(Object
      .entries(population as Struct<Array<Partial<unknown>>>)
      .map(async ([table, rows]) => {
        return Promise.all(rows.map(async (object) => {
          await this.insert(sql`
            INSERT IGNORE INTO \`${table}\` (${
              Object
                .keys(object)
                .map((column) => {
                  return `\`${column}\``
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
          `, object)
        }))
      }))
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
    const { affectedRows } = await this.query<Values, ResultSetHeader>(query, values)

    const result = {
      count: affectedRows
    }

    return result
  }
}
