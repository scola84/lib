import type { Options } from '../html-api'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { formatCode } from './format-code'
import { formatKeys } from './format-keys'
import { hyphenize } from '../../../common'
import { pickField } from './pick-field'

export function formatUpdateMany (schema: Schema, relations: Struct<Schema>, options: Options): string {
  return `
import { CrudUpdateManyHandler } from '@scola/lib'

export class UpdateManyHandler extends CrudUpdateManyHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public object = '${options.object}'

  public schema: CrudUpdateManyHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)}
  }

  public url = '${options.url}/update/many/${hyphenize(options.object)}'
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
