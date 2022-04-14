import type { Schema } from '../../../server/helpers/schema'
import type { WriteOptions } from '../html-ts'
import { createSelectSchema } from './create-select-schema'
import { createUpdateSchema } from './create-update-schema'
import { formatCode } from './format-code'
import { formatKeys } from './format-keys'
import { formatUrl } from './format-url'

export function formatUpdateOne (schema: Schema, options: WriteOptions): string {
  return `
import { CrudUpdateOneHandler } from '@scola/lib'

export class UpdateOneHandler extends CrudUpdateOneHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudUpdateOneHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)},
    query: ${formatQuerySchema(options.object, schema, 6)}
  }

  public url = '${formatUrl(options.url, options.name, 'update/one', 'uo')}'
}
`.trim()
}

function formatBodySchema (schema: Schema, space: number): string {
  return formatCode(
    {
      required: true,
      schema: createUpdateSchema(schema),
      type: 'fieldset'
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
