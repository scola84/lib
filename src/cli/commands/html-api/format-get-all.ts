import type { Schema, SchemaFieldKey } from '../../../server/helpers/schema'
import type { Options } from './options'
import type { Struct } from '../../../common'
import { formatCode } from './format-code'
import { formatInterface } from './format-interface'
import { pickField } from './pick-field'

export function formatGetAll (options: Options, schema: Schema, relations: Struct<Schema>): string {
  return `
import type { Query, QueryKeys, RouteData } from '@scola/lib'
import { RouteHandler } from '@scola/lib'

interface GetAllDataQuery extends Query ${formatQueryInterface(schema, 0)}

interface GetAllData extends RouteData {
  query: GetAllDataQuery
}

export class GetAllHandler extends RouteHandler {
  public keys: QueryKeys = ${formatKeys(options.object, schema, relations, 4)}

  public responseType = '${options.content}'

  public schema = {
    query: ${formatQuerySchema(schema, 6)}
  }

  protected async handle (data: GetAllData): Promise<unknown[]> {
    const {
      join,
      limit,
      order,
      select,
      values,
      where
    } = this.database.formatter.formatClauses('${options.object}', data.query, this.keys)

    const query = [
      \`SELECT \${select}\`,
      'FROM $[contact_address]',
      join,
      \`WHERE \${where}\`,
      \`ORDER BY \${order}\`,
      limit
    ].join(' ')

    return this.database.selectAll(query, values)
  }
}
`.trim()
}

function createQueryKeys (schema: Schema): Schema {
  return Object
    .entries(schema)
    .filter(([,field]) => {
      return (
        field.fkey !== undefined ||
        field.lkey !== undefined
      )
    })
    .reduce((result, [name, field]) => {
      return {
        [name]: pickField(field),
        ...result
      }
    }, {})
}

function createSearchKeys (object: string, schema: Schema, relations: Struct<Schema>): SchemaFieldKey[] {
  return Object
    .entries({
      [object]: schema,
      ...relations
    })
    .map(([table, tableSchema]) => {
      return Object
        .entries(tableSchema)
        .filter(([,field]) => {
          return field.search === true
        })
        .map(([column]) => {
          return {
            column,
            table
          }
        })
    })
    .flat()
}

function createSortKeys (object: string, schema: Schema, relations: Struct<Schema>): SchemaFieldKey[] {
  return Object
    .entries({
      [object]: schema,
      ...relations
    })
    .map(([table, tableSchema]) => {
      return Object
        .entries(tableSchema)
        .filter(([,field]) => {
          return field.sort === true
        })
        .map(([column]) => {
          return {
            column,
            table
          }
        })
    })
    .flat()
}

function formatQueryInterface (schema: Schema, space: number): string {
  return formatInterface(
    Object
      .entries(schema)
      .filter(([,field]) => {
        return (
          field.fkey !== undefined ||
          field.lkey !== undefined
        )
      })
      .reduce((result, [name, field]) => {
        return {
          [name]: pickField(field),
          ...result
        }
      }, {}),
    space
  )
}

function formatQuerySchema (schema: Schema, space: number): string {
  return formatCode(
    Object
      .entries({
        ...createQueryKeys(schema),
        count: {
          required: true,
          type: 'number'
        },
        cursor: {
          type: 'text'
        },
        offset: {
          type: 'number'
        },
        search: {
          type: 'text'
        },
        sortKey: {
          type: 'text'
        },
        sortOrder: {
          type: 'select',
          values: [
            'asc',
            'desc'
          ]
        }
      })
      .sort(([left], [right]) => {
        if (left < right) {
          return 1
        }

        return -1
      })
      .reduce((result, [name, field]) => {
        return {
          [name]: field,
          ...result
        }
      }, {}),
    space
  ).trimStart()
}

function formatKeys (object: string, schema: Schema, relations: Struct<Schema>, space: number): string {
  return formatCode(
    {
      foreign: Object
        .entries(schema)
        .filter(([,field]) => {
          return field.fkey !== undefined
        })
        .map(([,field]) => {
          return field.fkey
        }),
      link: Object
        .entries(schema)
        .filter(([,field]) => {
          return field.lkey !== undefined
        })
        .map(([,field]) => {
          return field.lkey
        }),
      search: createSearchKeys(object, schema, relations),
      sort: createSortKeys(object, schema, relations)
    },
    space
  ).trimStart()
}
