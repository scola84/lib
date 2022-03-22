import type { Options } from '../html-api'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { hyphenize } from '../../../common'
import { pickField } from './pick-field'
import { sortKeys } from './sort-keys'

export function formatSelectAll (schema: Schema, relations: Struct<Schema>, options: Options): string {
  return `
import { CrudSelectAllHandler } from '@scola/lib'

export class SelectAllHandler extends CrudSelectAllHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public object = '${options.object}'

  public schema: CrudSelectAllHandler['schema'] = {
    query: ${formatQuerySchema(schema, 6)}
  }

  public url = '${options.url}/select/all/${hyphenize(options.object)}'
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
    {
      required: true,
      schema: sortKeys({
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
      type: 'struct'
    },
    space
  ).trimStart()
}
