import { ConnectionPool } from 'mssql'
import { Database } from '../database'
import { MssqlConnection } from './connection'
import type { Struct } from '../../../../common'
import { URL } from 'url'
import { cast } from '../../../../common'
import type { config } from 'mssql'
import { format } from '../format'
import { formatters } from './formatters'
import { set } from 'lodash'

/**
 * Manages MSSQL connections.
 */
export class MssqlDatabase extends Database {
  public format = format(formatters)

  public pool: ConnectionPool

  public async connect (): Promise<MssqlConnection> {
    return Promise.resolve(new MssqlConnection(this.pool.request()))
  }

  public limit (query: { count?: number, cursor?: string, offset?: number }): {
    limit: string
    order: string | null
    values: Struct
    where: string | null
  } {
    const values: Struct = {}

    let limit = ''
    let order = null
    let where = null

    if (query.cursor !== undefined) {
      values.cursor = query.cursor
      limit += 'OFFSET 0 ROWS'
      order = `$[${'cursor'}] ASC`
      where = `$[${'cursor'}] > $(cursor)`
    } else if (query.offset !== undefined) {
      values.offset = query.offset
      limit += 'OFFSET $(offset) ROWS'
    }

    if (query.count !== undefined) {
      values.count = query.count
      limit += ' FETCH NEXT $(count) ROWS ONLY'
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

      this.pool = new ConnectionPool({
        ...options,
        password: this.password
      })

      this.pool.on('error', (error) => {
        this.logger?.error({
          context: 'pool'
        }, String(error))
      })

      await this.pool.connect()

      if (this.population !== undefined) {
        await this.populate(this.population)
      }
    }
  }

  public async stop (): Promise<void> {
    if (this.dsn !== undefined) {
      this.logger?.info({}, 'Stopping database')
      this.pool.removeAllListeners()
      await this.pool.close()
    }
  }

  protected parseDsn (dsn: string): config {
    const url = new URL(dsn)

    const options: config = {
      database: url.pathname.slice(1),
      port: 1433,
      server: url.hostname,
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

    return options
  }
}
