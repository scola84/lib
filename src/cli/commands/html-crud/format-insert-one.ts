import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { pickField } from './pick-field'
import { rejoin } from '../../../common'

export function formatInsertOne (schema: Schema, options: Options): string {
  return `
import { CrudInsertOneHandler } from '@scola/lib'

export class InsertOneHandler extends CrudInsertOneHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudInsertOneHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)}
  }

  public url = '${options.url}/insert/one/${rejoin(options.object, '-')}'
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
            field.rkey === undefined
          ) && (
            field.fkey !== undefined ||
            field.pkey !== true
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

function formatKeys (object: string, schema: Schema, space: number): string {
  const {
    auth,
    foreign,
    primary,
    related
  } = createKeys(object, schema)

  return formatCode(
    {
      auth,
      foreign,
      primary,
      related
    },
    space
  ).trimStart()
}
