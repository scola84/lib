import type { Schema } from '../../../server/helpers/schema'
import type { WriteOptions } from '../html-ts'
import { createFileFields } from './create-file-fields'
import { createModifiedFields } from './create-modified-fields'
import { createPrimaryFields } from './create-primary-fields'
import { createSelectSchema } from './create-select-schema'
import { formatCode } from './format-code'
import { formatKeys } from './format-keys'
import { formatUrl } from './format-url'
import { pickField } from './pick-field'
import { sortKeys } from './sort-keys'

export function formatSelectMany (schema: Schema, options: WriteOptions): string {
  return `
import { CrudSelectManyHandler } from '@scola/lib'

export class SelectManyHandler extends CrudSelectManyHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudSelectManyHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)},
    query: ${formatQuerySchema(options.object, schema, 6)}
  }

  public url = '${formatUrl(options.url, options.name, 'select/many', 'sm')}'
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

function formatQuerySchema (object: string, schema: Schema, space: number): string {
  return formatCode(
    {
      required: true,
      schema: {
        ...createSelectSchema(object, schema)
      },
      type: 'fieldset'
    },
    space
  ).trimStart()
}
