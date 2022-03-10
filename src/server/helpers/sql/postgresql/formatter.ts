import type { Query, QueryParts } from '../query'
import { isArray, isDate, isNil, isObject, isPrimitive } from '../../../../common'
import { Formatter } from '../formatter'
import type { SchemaField } from '../../schema'
import type { Struct } from '../../../../common'
import { literal } from 'pg-format'

export class PostgresqlFormatter extends Formatter {
  public formatDdl (object: string, fields: Struct<SchemaField>): string {
    const lines = [
      `CREATE TABLE "public"."${object}" (`,
      [
        '  "created" TIMESTAMPTZ NOT NULL DEFAULT now()',
        '  "updated" TIMESTAMPTZ NOT NULL DEFAULT now()',
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
          .formatDdlConstraintPrimaryKey(object, fields)
          .map((line) => {
            return line.padStart(line.length + 2, ' ')
          }),
        ...this
          .formatDdlConstraintForeignKeys(object, fields)
          .map((line) => {
            return line.padStart(line.length + 2, ' ')
          })
      ].join(',\n'),
      ');',
      this
        .formatDdlIndex(object, fields)
        .join(',\n'),
      this
        .formatDdlIndexCursor(object, fields)
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
    return `"${value.replace(/\./gu, '"."')}"`
  }

  public formatParameter (value: unknown): string {
    if ((
      isArray(value) ||
      isDate(value) ||
      isNil(value) ||
      isObject(value) ||
      isPrimitive(value)
    ) && (
      typeof value !== 'symbol'
    )) {
      return literal(value)
    }

    return String(value)
  }

  protected createSelectAllPartsLimit (query: Query): QueryParts {
    const values: Struct = {}

    let limit = null
    let order = null
    let where = null

    if (query.cursor !== undefined) {
      values.count = query.count
      values.cursor = query.cursor
      limit = 'LIMIT $(count)'
      order = `$[${'cursor'}] ASC`
      where = `$[${'cursor'}] > $(cursor)`
    } else if (query.offset !== undefined) {
      values.count = query.count
      values.offset = query.offset
      limit = 'LIMIT $(count) OFFSET $(offset)'
    }

    return {
      limit: limit ?? undefined,
      order: order ?? undefined,
      values,
      where: where ?? undefined
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
    let ddl = `"${name}" TIMESTAMPTZ`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    if (field.default !== undefined) {
      ddl += ' DEFAULT now()'
    }

    return ddl
  }

  protected formatDdlColumnDefault (name: string, field: SchemaField): string {
    let ddl = `"${name}" CHARACTER VARYING`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    if (field.default !== undefined) {
      ddl += ` DEFAULT '${field.default}'::character`
    }

    return ddl
  }

  protected formatDdlColumnNumber (name: string, field: SchemaField): string {
    let ddl = `"${name}"`

    if (field.pkey === true) {
      ddl += ' SERIAL'
    } else {
      ddl += ' INTEGER'

      if (field.required === true) {
        ddl += ' NOT NULL'
      }

      if (field.default !== undefined) {
        ddl += ` DEFAULT ${field.default}`
      }
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
    let ddl = `${name} TIMETZ`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    if (field.default !== undefined) {
      ddl += ' DEFAULT now()'
    }

    return ddl
  }

  protected formatDdlColumns (fields: Struct<SchemaField>): string[] {
    return Object
      .entries(fields)
      .filter(([,field]) => {
        return field.lkey === undefined
      })
      .map(([name, field]) => {
        return this.formatDdlColumn(name, field)
      })
  }

  protected formatDdlConstraintForeignKeys (object: string, fields: Struct<SchemaField>): string[] {
    return Object
      .entries(fields)
      .filter(([, field]) => {
        return field.fkey !== undefined
      })
      .map(([name, field]) => {
        return [
          `CONSTRAINT "fkey_${object}_${name}"`,
          `FOREIGN KEY ("${name}")`,
          `REFERENCES "${field.fkey?.table ?? ''}" ("${field.fkey?.column ?? ''}")`,
          'ON DELETE CASCADE'
        ].join(' ')
      })
  }

  protected formatDdlConstraintPrimaryKey (object: string, fields: Struct<SchemaField>): string[] {
    const lines = []

    const columns = Object
      .entries(fields)
      .filter(([, field]) => {
        return field.pkey === true
      })
      .map(([name]) => {
        return `"${name}"`
      })

    if (columns.length > 0) {
      lines.push([
        `CONSTRAINT "pkey_${object}"`,
        `PRIMARY KEY (${columns.join(',')})`
      ].join(' '))
    }

    return lines
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
          return `"${name}"`
        }

        return `COALESCE("${name}", '')`
      })

    if (columns.length > 0) {
      lines.push([
        '"cursor" TEXT GENERATED ALWAYS',
        `AS (${columns.join(' || ')}) STORED`
      ].join(' '))
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

            columns[Number(indexIndex)] = `"${name}"`
          })
      })

    return Object
      .entries(indexes)
      .map(([name, columns = []]) => {
        return [
          `CREATE INDEX "index_${object}_${name}"`,
          `ON "${object}" (${columns.join(',')})`
        ].join(' ')
      })
  }

  protected formatDdlIndexCursor (object: string, fields: Struct<SchemaField>): string[] {
    const lines = []

    const hasCursor = Object
      .entries(fields)
      .some(([,field]) => {
        return field.cursor !== undefined
      })

    if (hasCursor) {
      lines.push([
        `CREATE INDEX "index_${object}_cursor"`,
        `ON "${object}" ("cursor");`
      ].join(' '))
    }

    return lines
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

            columns[Number(indexIndex)] = `"${name}"`
          })
      })

    return Object
      .entries(indexes)
      .map(([name, columns = []]) => {
        return [
          `CREATE UNIQUE INDEX "index_${object}_${name}"`,
          `ON "${object}" (${columns.join(',')});`
        ].join(' ')
      })
  }
}
