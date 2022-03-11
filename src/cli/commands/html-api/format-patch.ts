import type { Options } from './options'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { pickField } from './pick-field'

export function formatPatch (options: Options, schema: Schema, relations: Struct<Schema>): string {
  return `
import { RestPatchHandler } from '@scola/lib'

export class PatchHandler extends RestPatchHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public method = 'PATCH'

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
        return field.rkey === undefined && (
          field.pkey !== true ||
          field.fkey !== undefined
        )
      })
      .reduce((result, [name, field]) => {
        return {
          ...result,
          [name]: {
            ...pickField(field),
            required: undefined
          }
        }
      }, {}),
    space
  ).trimStart()
}

function formatKeys (object: string, schema: Schema, relations: Struct<Schema>, space: number): string {
  const {
    auth,
    primary
  } = createKeys(object, schema, relations)

  return formatCode(
    {
      auth,
      primary
    },
    space
  ).trimStart()
}
