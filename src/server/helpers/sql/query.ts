import { sql } from './tag'

export class Query {
  public entity: Record<string, unknown>

  public table: string

  public constructor (table: string, entity: Record<string, unknown>) {
    this.entity = entity
    this.table = table
  }

  public delete (): string {
    return sql`
      DELETE
      FROM ${this.table}
      WHERE ${
        Object
          .keys(this.entity)
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

  public insert (): string {
    return sql`
      INSERT INTO ${this.table} (${
        Object
          .keys(this.entity)
          .join(',')
      }) VALUES (${
        Object
          .keys(this.entity)
          .map((column) => {
            return `$(${column})`
          })
        .join(',')
      })
    `
  }

  public select (): string {
    return sql`
      SELECT ${
        Object
          .keys(this.entity)
          .join(',')
      }
      FROM ${this.table}
      WHERE ${
        Object
          .keys(this.entity)
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

  public update (): string {
    return sql`
      UPDATE ${this.table}
      SET ${
        Object
          .keys(this.entity)
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
          .keys(this.entity)
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
