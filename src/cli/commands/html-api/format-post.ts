import type { Options } from './options'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { pickField } from './pick-field'

export function formatPost (options: Options, schema: Schema, relations: Struct<Schema>): string {
  return `
import { RestPostHandler } from '@scola/lib'

export class PostHandler extends RestPostHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public method = 'POST'

  public object = '${options.object}'

  public schema = {
    body: ${formatBodySchema(schema, 6)}
  }

  public url = '${options.url}'
}
`.trim()
}

function formatBodySchema (schema: Schema, space: number): string {
  return formatCode(
    Object
      .entries(schema)
      .filter(([,field]) => {
        return (
          field.rkey === undefined &&
          field.default !== '$updated'
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
