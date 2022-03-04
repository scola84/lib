import type { Pool, PoolOptions } from 'mysql2/promise'
import { cast, isStruct } from '../../../../common'
import { Database } from '../database'
import { MysqlConnection } from './connection'
import type { Struct } from '../../../../common'
import { URL } from 'url'
import { createPool } from 'mysql2/promise'
import { format } from '../format'
import { formatters } from './formatters'
import { readFileSync } from 'fs-extra'
import { set } from 'lodash'

/**
 * Manages MySQL connections.
 */
export class MysqlDatabase extends Database {
  public format = format(formatters)

  public pool: Pool

  public async connect (): Promise<MysqlConnection> {
    return new MysqlConnection(await this.pool.getConnection())
  }

  public limit (query: { count?: number, cursor?: string, offset?: number }): {
    limit: string
    order: string | null
    values: Struct
    where: string | null
  } {
    const values: Struct = {}

    let limit = 'LIMIT'
    let order = null
    let where = null

    if (query.count !== undefined) {
      values.count = query.count
      limit += ' $(count)'
    }

    if (query.cursor !== undefined) {
      values.cursor = query.cursor
      order = `$[${'cursor'}] ASC`
      where = `$[${'cursor'}] > $(cursor)`
    } else if (query.offset !== undefined) {
      values.offset = query.offset
      limit += ' OFFSET $(offset)'
    }

    return {
      limit,
      order,
      values,
      where
    }
  }

  public search (query: {search?: string}, columns: string[], locale?: string): {
    where: string | null
    values: Struct
  } {
    const values: Struct = {}

    let where: string | null = this.intl
      .parse(String(query.search ?? ''), locale)
      .map(({ name, value }, index) => {
        if (name === undefined) {
          return columns
            .map((column) => {
              values[`${column}${index}`] = value
              return `$[${column}] = $(${column}${index})`
            })
            .join(') OR (')
        }

        if (columns.includes(name)) {
          values[name] = value
          return `$[${name}] = $(${name})`
        }

        return ''
      })
      .filter((part) => {
        return part !== ''
      })
      .join(') AND (')

    if (where.length > 0) {
      where = `(${where})`
    } else {
      where = null
    }

    return {
      values,
      where
    }
  }

  public sort (query: { sortKey?: string, sortOrder?: string}): {
    order: string
  } {
    let order = '1'

    if (query.sortKey !== undefined) {
      order = `${query.sortKey} ${query.sortOrder ?? 'ASC'}`
    }

    return {
      order
    }
  }

  public async start (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger = this.logger?.child({
        name: this.name
      })

      const options = this.parseDsn(this.dsn)

      this.logger?.info(options, 'Starting database')

      this.pool = createPool({
        ...options,
        password: this.password
      })

      if (this.population !== undefined) {
        await this.populate(this.population)
      }
    }
  }

  public async stop (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger?.info({}, 'Stopping database')
      await this.pool.end()
    }
  }

  protected parseDsn (dsn: string): PoolOptions {
    const url = new URL(dsn)

    const options: PoolOptions = {
      database: url.pathname.slice(1),
      decimalNumbers: true,
      host: url.hostname,
      port: 3306,
      supportBigNumbers: true,
      user: url.username
    }

    if (url.port !== '') {
      options.port = Number(url.port)
    }

    Array
      .from(url.searchParams.entries())
      .forEach(([name, value]) => {
        set(options, name, cast(value))
      })

    const sslNames = ['ca', 'cert', 'key']

    sslNames.forEach((name) => {
      if (isStruct(options.ssl)) {
        const value = options.ssl[name]

        if (typeof value === 'string') {
          options.ssl[name] = readFileSync(value)
        }
      }
    })

    return options
  }
}
