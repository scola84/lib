import { sql } from './tag'

export class Query {
  public constructor (properties: Record<string, unknown>) {
    Object.assign(this, properties)
  }

  public delete (table: string): string {
    return sql`
      DELETE
      FROM ${table}
      WHERE ${
        Object
          .keys(this)
          .filter((column) => {
            return column.endsWith('id')
          })
          .map((column) => {
            return `${column} = $(${column})`
          })
          .join(' AND ')
      }
    `
  }

  public insert (table: string): string {
    return sql`
      INSERT INTO ${table} (${
        Object
          .keys(this)
          .join(',')
      }) VALUES (${
        Object
          .keys(this)
          .map((column) => {
            return `$(${column})`
          })
        .join(',')
      })
    `
  }

  public select (table: string): string {
    return sql`
      SELECT ${
        Object
          .keys(this)
          .join(',')
      }
      FROM ${table}
      WHERE ${
        Object
          .keys(this)
          .filter((column) => {
            return column.endsWith('id')
          })
          .map((column) => {
            return `${column} = $(${column})`
          })
          .join(' AND ')
      }
    `
  }

  public update (table: string): string {
    return sql`
      UPDATE ${table}
      SET ${
        Object
          .keys(this)
          .filter((column) => {
            return !column.endsWith('id')
          })
          .map((column) => {
            return `${column} = $(${column})`
          })
          .join(',')
      }
      WHERE ${
        Object
          .keys(this)
          .filter((column) => {
            return column.endsWith('id')
          })
          .map((column) => {
            return `${column} = $(${column})`
          })
          .join(' AND ')
      }
    `
  }
}
