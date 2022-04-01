import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import { createFileFields } from './create-file-fields'
import { createModifiedFields } from './create-modified-fields'
import { createPrimaryFields } from './create-primary-fields'
import { formatCode } from './format-code'
import { formatKeys } from './format-keys'
import { pickField } from './pick-field'
import { toJoint } from '../../../common'
import { sortKeys } from './sort-keys'

export function formatSelectMany (schema: Schema, options: Options): string {
  return `
import { CrudSelectManyHandler } from '@scola/lib'

export class SelectManyHandler extends CrudSelectManyHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudSelectManyHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)},
    headers: ${formatHeadersSchema(6)}
  }

  public url = '${options.url}/select/many/${toJoint(options.object, '-')}'
}
`.trim()
}

function createBodyFields (schema: Schema): Schema {
  return sortKeys({
    ...createPrimaryFields(schema),
    ...createModifiedFields(schema),
    ...createFileFields(schema)
  })
}

function formatBodySchema (schema: Schema, space: number): string {
  return formatCode(
    {
      schema: Object
        .entries(createBodyFields(schema))
        .reduce((result, [name, field]) => {
          return {
            ...result,
            [name]: pickField(field)
          }
        }, {}),
      type: 'array'
    },
    space
  ).trimStart()
}

function formatHeadersSchema (space: number): string {
  return formatCode(
    {
      schema: {
        'if-modified-since': {
          type: 'datetime-local'
        }
      },
      type: 'struct'
    },
    space
  ).trimStart()
}
