import type { Schema, SchemaField } from '../../schema'
import type { SqlQuery, SqlQueryKeys, SqlQueryParts } from '../query'
import { Struct, isArray, isNil, isObject, isPrimitive } from '../../../../common'
import type { Query } from '../../../../common'
import type { SqlDdl } from '../formatter'
import { SqlFormatter } from '../formatter'
import type { User } from '../../../entities'
import { literal } from 'pg-format'
import { sql } from '../tag'

export class PgsqlFormatter extends SqlFormatter {
  public createInsertQuery (object: string, schema: Schema, keys: SqlQueryKeys, data: Struct, user?: User): SqlQuery {
    let {
      string,
      values
    } = super.createInsertQuery(object, schema, keys, data, user)

    if (keys.primary?.length === 1) {
      string = sql`
        ${string}
        RETURNING $[${keys.primary[0].column}]
      `
    }

    return {
      string,
      values
    }
  }

  public formatDdl (database: string, object: string, fields: Struct<SchemaField>): SqlDdl {
    const connect = `\\connect "${database}"`

    const create = [
      `CREATE TABLE "${object}" (`,
      [
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
          })
      ].join(',\n'),
      ');'
    ].join('\n')

    const fkeys = this
      .formatDdlConstraintForeignKeys(object, fields)
      .join('\n')
      .trim()

    const indexes = ([
      this
        .formatDdlIndex(object, fields)
        .join('\n'),
      this
        .formatDdlIndexCursor(object, fields)
        .join('\n'),
      this
        .formatDdlIndexUnique(object, fields)
        .join('\n')
    ]).filter((line) => {
      return line !== ''
    }).join('\n')
      .trim()

    return {
      connect,
      create,
      fkeys,
      indexes
    }
  }

  public formatIdentifier (value: string): string {
    return `"${value.replace(/\./gu, '"."')}"`
  }

  public formatParameter (value: unknown): string {
    if ((
      isArray(value) ||
      isNil(value) ||
      isObject(value) ||
      isPrimitive(value) ||
      value instanceof Date
    ) && (
      typeof value !== 'symbol' &&
      !Number.isFinite(value)
    )) {
      return literal(value)
    }

    return String(value)
  }

  protected createSelectAllPartsLimit (query: Query): SqlQueryParts {
    const values = Struct.create<Query>({
      limit: query.limit ?? 10
    })

    let limit = null
    let order = null
    let where = null

    if (query.cursor === undefined) {
      values.offset = query.offset ?? 0
      limit = 'LIMIT $(limit) OFFSET $(offset)'
    } else {
      values.cursor = query.cursor
      limit = 'LIMIT $(limit) OFFSET 0'
      order = `$[${'cursor'}] ASC`
      where = `$[${'cursor'}] > $(cursor)`
    }

    return {
      limit: limit,
      order: order ?? undefined,
      values: values,
      where: where ?? undefined
    }
  }

  protected formatDdlColumn (name: string, field: SchemaField): string {
    switch (field.type) {
      case 'checkbox':
        return this.formatDdlColumnCheckbox(name, field)
      case 'date':
        return this.formatDdlColumnDate(name, field)
      case 'datetime-local':
        return this.formatDdlColumnDatetimeLocal(name, field)
      case 'fieldset':
        return this.formatDdlColumnFieldset(name, field)
      case 'file':
        return this.formatDdlColumnFile(name, field)
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

  protected formatDdlColumnCheckbox (name: string, field: SchemaField): string {
    if (!(
      field.values?.length === 2 &&
      field.values[0] === true &&
      field.values[1] === false
    )) {
      return this.formatDdlColumnDefault(name, field)
    }

    let ddl = `"${name}" BOOLEAN`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    return ddl
  }

  protected formatDdlColumnDate (name: string, field: SchemaField): string {
    let ddl = `"${name}" TIMESTAMPTZ`

    if (field.required === true) {
      ddl += ' NOT NULL'

      if (field.value === undefined) {
        ddl += ' DEFAULT CURRENT_TIMESTAMP'
      }
    }

    if (field.value !== undefined) {
      ddl += ` DEFAULT ${field.value.toString()}`
    }

    return ddl
  }

  protected formatDdlColumnDatetimeLocal (name: string, field: SchemaField): string {
    let ddl = `"${name}" TIMESTAMPTZ`

    if (field.required === true) {
      ddl += ' NOT NULL'

      if (field.value === undefined) {
        ddl += ' DEFAULT CURRENT_TIMESTAMP'
      }
    }

    if (field.value !== undefined) {
      ddl += ` DEFAULT ${field.value.toString()}`
    }

    return ddl
  }

  protected formatDdlColumnDefault (name: string, field: SchemaField): string {
    let ddl = `"${name}" CHARACTER VARYING`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    if (field.value !== undefined) {
      ddl += ` DEFAULT '${field.value.toString()}'::CHARACTER`
    }

    return ddl
  }

  protected formatDdlColumnFieldset (name: string, field: SchemaField): string {
    let ddl = `"${name}" JSON`

    if (field.required === true) {
      ddl += ' NOT NULL'

      if (field.value === undefined) {
        ddl += ' DEFAULT \'{}\'::JSON'
      }
    }

    if (field.value !== undefined) {
      ddl += ` DEFAULT '${field.value.toString()}'::JSON`
    }

    return ddl
  }

  protected formatDdlColumnFile (name: string, field: SchemaField): string {
    let ddl = `"${name}" JSON`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    return ddl
  }

  protected formatDdlColumnNumber (name: string, field: SchemaField): string {
    let ddl = `"${name}"`

    if (field.serial === true) {
      ddl += ' SERIAL'
    } else {
      if (field.step === undefined) {
        ddl += ' INTEGER'
      } else {
        ddl += ' NUMERIC'
      }

      if (field.required === true) {
        ddl += ' NOT NULL'
      }

      if (field.value !== undefined) {
        ddl += ` DEFAULT ${field.value.toString()}`
      }
    }

    return ddl
  }

  protected formatDdlColumnTextarea (name: string, field: SchemaField): string {
    let ddl = `"${name}" TEXT`

    if (field.required === true) {
      ddl += ' NOT NULL'
    }

    return ddl
  }

  protected formatDdlColumnTime (name: string, field: SchemaField): string {
    let ddl = `"${name}" TIMESTAMPTZ`

    if (field.required === true) {
      ddl += ' NOT NULL'

      if (field.value === undefined) {
        ddl += ' DEFAULT CURRENT_TIMESTAMP'
      }
    }

    if (field.value !== undefined) {
      ddl += ` DEFAULT ${field.value.toString()}`
    }

    return ddl
  }

  protected formatDdlColumns (fields: Struct<SchemaField>): string[] {
    return Object
      .entries(fields)
      .filter(([,field]) => {
        return field.rkey === undefined
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
          `ALTER TABLE "${object}"`,
          `ADD CONSTRAINT "fkey_${object}_${name}"`,
          `FOREIGN KEY ("${name}")`,
          `REFERENCES "${field.fkey?.table ?? ''}" ("${field.fkey?.column ?? ''}")`,
          `ON DELETE ${field.fkeyDelete?.toUpperCase() ?? 'NO ACTION'};`
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
            const [indexName, indexIndex = 0] = index.split(':')

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
          `ON "${object}" (${columns.join(',')});`
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
            const [indexName, indexIndex = 0] = unique.split(':')

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