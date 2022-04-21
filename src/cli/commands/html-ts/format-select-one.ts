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

export function formatSelectOne (schema: Schema, options: WriteOptions): string {
  return `
import { CrudSelectOneHandler } from '@scola/lib'

export class SelectOneHandler extends CrudSelectOneHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudSelectOneHandler['schema'] = {
    query: ${formatQuerySchema(options.object, schema, 6)}
  }

  public url = '${formatUrl(options.url, options.name, 'select/one', 'so')}'
}
`.trim()
}

function createWhereFields (schema: Schema): Schema {
  return sortKeys({
    ...createPrimaryFields(schema),
    ...createModifiedFields(schema),
    ...createFileFields(schema)
  })
}

function createWhereSchema (schema: Schema): Schema {
  return {
    where: {
      required: true,
      schema: Object
        .entries(createWhereFields(schema))
        .reduce((result, [name, field]) => {
          return {
            ...result,
            [name]: pickField(field)
          }
        }, {}),
      type: 'fieldset'
    }
  }
}

function formatQuerySchema (object: string, schema: Schema, space: number): string {
  return formatCode(
    {
      required: true,
      schema: {
        ...createSelectSchema(object, schema),
        ...createWhereSchema(schema)
      },
      type: 'fieldset'
    },
    space
  ).trimStart()
}