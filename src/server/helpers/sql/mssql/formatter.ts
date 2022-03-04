import { ScolaIntl, isStruct } from '../../../../common'
import { Formatter } from '../formatter'
import type { SchemaField } from '../../schema'
import type { Struct } from '../../../../common'
import { escape } from 'sqlstring'

export class MssqlFormatter extends Formatter {
  public intl = new ScolaIntl()

  public formatDdl (object: string, fields: Struct<SchemaField>): string {
    const lines = [
      `CREATE TABLE [${object}] (`,
      [
        '  [created] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
        '  [updated] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
        ...this
          .formatDdlColumns(fields)
          .map((line) => {
            return line.padStart(line.length + 2, ' ')
          }),
        ...this
          .formatDdlCursor(fields)
          .map((line) => {
            return line.padStart(line.length + 2, ' ')
          }),
        ...this
          .formatDdlPrimaryKey(object, fields)
          .map((line) => {
            return line.padStart(line.length + 2, ' ')
          })
      ].join(',\n'),
      ');',
      this
        .formatDdlIndex(object, fields)
        .join(',\n'),
      this
        .formatDdlIndexUnique(object, fields)
        .join(',\n')
    ]

    return lines
      .filter((line) => {
        return line !== ''
      })
      .join('\n')
  }

  public formatIdentifier (value: string): string {
    return `[${value.replace(/\./gu, '].[')}]`
  }

  public formatLimit (query: { count?: number, cursor?: string, offset?: number }): {
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

  public formatParameter (value: unknown): string {
    if (
      isStruct(value) ||
      typeof value === 'boolean'
    ) {
      return escape(JSON.stringify(value))
    }

    return escape(value)
  }

  public formatSearch (query: {search?: string}, columns: string[], locale?: string): {
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

  public formatSort (query: { sortKey?: string, sortOrder?: string}): {
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

  protected formatDdlColumn (name: string, field: SchemaField): string {
    switch (field.type) {
      case 'date':
        return this.formatDdlColumnDate(name, field)
      case 'number':
        return this.formatDdlColumnNumber(name, field)
      case 'textarea':
        return this.formatDdlColumnTextarea(name, field)
      case 'time':
        return this.formatDdlColumnTime(name, field)
      default:
        return this.formatDdlColumnDefault(name, field)
    }
  }

  protected formatDdlColumnDate (name: string, field: SchemaField): string {
    let ddl = `[${name}] DATETIME`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    if (field.default !== undefined) {
      ddl += ' DEFAULT CURRENT_TIMESTAMP'
    }

    return ddl
  }

  protected formatDdlColumnDefault (name: string, field: SchemaField): string {
    let ddl = `[${name}] VARCHAR(255)`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    if (field.default !== undefined) {
      ddl += ` DEFAULT '${field.default}'`
    }

    return ddl
  }

  protected formatDdlColumnNumber (name: string, field: SchemaField): string {
    let ddl = `[${name}] INTEGER`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    if (field.default !== undefined) {
      ddl += ` DEFAULT ${field.default}`
    }

    if (field.key === true) {
      ddl += ' IDENTITY(1,1)'
    }

    return ddl
  }

  protected formatDdlColumnTextarea (name: string, field: SchemaField): string {
    let ddl = `${name} TEXT`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    return ddl
  }

  protected formatDdlColumnTime (name: string, field: SchemaField): string {
    let ddl = `${name} TIME`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    if (field.default !== undefined) {
      ddl += ' DEFAULT CURRENT_TIMESTAMP'
    }

    return ddl
  }

  protected formatDdlColumns (fields: Struct<SchemaField>): string[] {
    return Object
      .entries(fields)
      .map(([name, field]) => {
        return this.formatDdlColumn(name, field)
      })
  }

  protected formatDdlCursor (fields: Struct<SchemaField>): string[] {
    const lines = []

    const columns = Object
      .entries(fields)
      .filter(([, field]) => {
        return field.cursor !== undefined
      })
      .sort(([,left], [,right]) => {
        return (left.cursor ?? 0) - (right.cursor ?? 0)
      })
      .map(([name, field]) => {
        if (field.required === true) {
          return `[${name}]`
        }

        return `COALESCE([${name}], '')`
      })

    if (columns.length > 0) {
      lines.push(`[cursor] AS (CONCAT(${columns.join(',')})) PERSISTED`)
    }

    return lines
  }

  protected formatDdlIndex (object: string, fields: Struct<SchemaField>): string[] {
    const indexes: Struct<string[] | undefined> = {}

    Object
      .entries(fields)
      .forEach(([name, field]) => {
        field.index
          ?.split(' ')
          .forEach((index) => {
            const [indexName, indexIndex] = index.split(':')

            let columns = indexes[indexName]

            if (columns === undefined) {
              columns = []
              indexes[indexName] = columns
            }

            columns[Number(indexIndex)] = `[${name}]`
          })
      })

    return Object
      .entries(indexes)
      .map(([name, columns = []]) => {
        return `CREATE INDEX [${object}_${name}] ON [${object}] (${columns.join(',')})`
      })
  }

  protected formatDdlIndexUnique (object: string, fields: Struct<SchemaField>): string[] {
    const indexes: Struct<string[] | undefined> = {}

    Object
      .entries(fields)
      .forEach(([name, field]) => {
        field.unique
          ?.split(' ')
          .forEach((unique) => {
            const [indexName, indexIndex] = unique.split(':')

            let columns = indexes[indexName]

            if (columns === undefined) {
              columns = []
              indexes[indexName] = columns
            }

            columns[Number(indexIndex)] = `[${name}]`
          })
      })

    return Object
      .entries(indexes)
      .map(([name, columns = []]) => {
        return `CREATE UNIQUE INDEX [${object}_${name}] ON [${object}] (${columns.join(',')});`
      })
  }

  protected formatDdlPrimaryKey (object: string, fields: Struct<SchemaField>): string[] {
    const lines = []

    const columns = Object
      .entries(fields)
      .filter(([, field]) => {
        return field.key === true
      })
      .map(([name]) => {
        return name
      })

    if (columns.length > 0) {
      lines.push(`CONSTRAINT [${object}_pkey] PRIMARY KEY (${columns.join(',')})`)
    }

    return lines
  }
}
