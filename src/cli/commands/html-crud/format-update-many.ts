import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import { formatCode } from './format-code'
import { formatKeys } from './format-keys'
import { pickField } from './pick-field'
import { toJoint } from '../../../common'

export function formatUpdateMany (schema: Schema, options: Options): string {
  return `
import { CrudUpdateManyHandler } from '@scola/lib'

export class UpdateManyHandler extends CrudUpdateManyHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudUpdateManyHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)}
  }

  public url = '${options.url}/update/many/${toJoint(options.object, '-')}'
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
      type: 'array'
    },
    space
  ).trimStart()
}
