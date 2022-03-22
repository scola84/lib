import type { Options } from '../html-api'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { hyphenize } from '../../../common'
import { pickField } from './pick-field'

export function formatInsertOne (schema: Schema, relations: Struct<Schema>, options: Options): string {
  return `
import { CrudInsertOneHandler } from '@scola/lib'

export class InsertOneHandler extends CrudInsertOneHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public object = '${options.object}'

  public schema: CrudInsertOneHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)}
  }

  public url = '${options.url}/insert/one/${hyphenize(options.object)}'
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

function formatKeys (object: string, schema: Schema, relations: Struct<Schema>, space: number): string {
  const {
    auth,
    foreign,
    primary,
    related
  } = createKeys(object, schema, relations)

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
