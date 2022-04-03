import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import { createSelectSchema } from './create-select-schema'
import { formatCode } from './format-code'
import { formatKeys } from './format-keys'
import { pickField } from './pick-field'
import { toJoint } from '../../../common'

export function formatUpdateOne (schema: Schema, options: Options): string {
  return `
import { CrudUpdateOneHandler } from '@scola/lib'

export class UpdateOneHandler extends CrudUpdateOneHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudUpdateOneHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)},
    query: ${formatQuerySchema(options.object, schema, 6)}
  }

  public url = '${options.url}/update/one/${toJoint(options.object, '-')}'
}
`.trim()
}

function formatBodySchema (schema: Schema, space: number): string {
  return formatCode(
    {
      required: true,
      schema: Object
        .entries(schema)
        .filter(([,field]) => {
          return (
            field.rkey === undefined &&
            field.default !== '$created'
          ) && (
            field.fkey === undefined ||
            field.pkey === true
          )
        })
        .reduce((result, [name, field]) => {
          return {
            ...result,
            [name]: pickField(field)
          }
        }, {}),
      type: 'struct'
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
      type: 'struct'
    },
    space
  ).trimStart()
}
