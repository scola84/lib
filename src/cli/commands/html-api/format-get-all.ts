import type { Options } from './options'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { pickField } from './pick-field'
import { sortKeys } from './sort-keys'

export function formatGetAll (options: Options, schema: Schema, relations: Struct<Schema>): string {
  return `
import { RestGetAllHandler } from '@scola/lib'

export class GetAllHandler extends RestGetAllHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public method = 'GET'

  public object = '${options.object}'

  public schema = {
    query: ${formatQuerySchema(schema, 6)}
  }

  public url = '${options.url}/all'
}
`.trim()
}

function createQueryKeys (schema: Schema): Schema {
  return Object
    .entries(schema)
    .filter(([,field]) => {
      return (
        field.fkey !== undefined ||
        field.rkey !== undefined
      )
    })
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: {
          ...pickField(field),
          required: undefined
        }
      }
    }, {})
}

function formatKeys (object: string, schema: Schema, relations: Struct<Schema>, space: number): string {
  return formatCode(
    createKeys(object, schema, relations),
    space
  ).trimStart()
}

function formatQuerySchema (schema: Schema, space: number): string {
  return formatCode(
    sortKeys({
      ...createQueryKeys(schema),
      count: {
        default: 10,
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
    }),
    space
  ).trimStart()
}
