import type { PoolConnection, ResultSetHeader } from 'mysql2/promise'
import type { Connection as BaseConnection } from 'mysql'
import { MysqlFormatter } from './formatter'
import type { Readable } from 'stream'
import { SqlConnection } from '../connection'
import type { SqlQuery } from '../query'
import type { Struct } from '../../../../common'
import { sql } from '../tag'

interface StreamConnection extends PoolConnection {
  connection: BaseConnection
}

/**
 * Executes MySQL queries.
 */
export class MysqlConnection extends SqlConnection {
  public connection: PoolConnection

  public formatter = new MysqlFormatter()

  /**
   * Creates a MySQL connection.
   *
   * @param connection - The underlying connection
   */
  public constructor (connection: PoolConnection) {
    super()
    this.connection = connection
  }

  public async delete<Values = Struct>(string: string, values?: Partial<Values>): Promise<Partial<Values> | undefined> {
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

  public async execute<Values = Struct, Result = Struct>(query: SqlQuery<Partial<Values>>): Promise<Result[]> {
    return await this.connection.query(this.formatter.formatQuery(query)) as unknown as Result[]
  }

  public async insert<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>, key = 'id'): Promise<Result> {
    const [{ insertId }] = await this.execute<Values, ResultSetHeader>({
      string,
      values
    })

    return {
      ...values,
      [key]: insertId
    } as unknown as Result
  }

  public async insertAll<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>, key = 'id'): Promise<Result[]> {
    const [{ insertId }] = await this.execute<Values, ResultSetHeader>({
      string,
      values
    })

    return [{
      [key]: insertId
    }] as unknown[] as Result[]
  }

  public async populate (population: Partial<Struct<Array<Partial<unknown>>>>): Promise<void> {
    await Promise.all(Object
      .entries(population as Struct<Array<Partial<unknown>>>)
      .map(async ([table, rows]) => {
        await Promise.all(rows.map(async (object) => {
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

  public release (): void {
    this.connection.release()
  }

  public async select<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result | undefined> {
    const [object] = await this.execute<Values, Result>({
      string,
      values
    })

    return object
  }

  public async selectAll<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result[]> {
    return this.execute<Values, Result>({
      string,
      values
    })
  }

  public async selectOne<Values = Struct, Result = Struct>(string: string, values?: Partial<Values>): Promise<Result> {
    const [object] = await this.execute<Values, Result>({
      string,
      values
    })

    if (object === undefined) {
      throw new Error(`Object is undefined (${JSON.stringify(values)})`)
    }

    return object
  }

  public stream<Values = Struct>(string: string, values?: Partial<Values>): Readable {
    return (this.connection as StreamConnection).connection
      .query(this.formatter.formatQuery({
        string,
        values
      }))
      .stream()
  }

  public async update<Values = Struct>(string: string, values?: Partial<Values>): Promise<Partial<Values> | undefined> {
    await this.execute<Values, ResultSetHeader>({
      string,
      values
    })

    return values
  }
}
