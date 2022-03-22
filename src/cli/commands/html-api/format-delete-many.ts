import type { Options } from '../html-api'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createFileFields } from './create-file-fields'
import { createModifiedFields } from './create-modified-fields'
import { createPrimaryFields } from './create-primary-fields'
import { formatCode } from './format-code'
import { formatKeys } from './format-keys'
import { hyphenize } from '../../../common'
import { pickField } from './pick-field'
import { sortKeys } from './sort-keys'

export function formatDeleteMany (schema: Schema, relations: Struct<Schema>, options: Options): string {
  return `
import { CrudDeleteManyHandler } from '@scola/lib'

export class DeleteManyHandler extends CrudDeleteManyHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public object = '${options.object}'

  public schema: CrudDeleteManyHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)}
  }

  public url = '${options.url}/delete/many/${hyphenize(options.object)}'
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
      required: true,
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
