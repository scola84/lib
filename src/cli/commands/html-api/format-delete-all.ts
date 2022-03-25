import type { Options } from '../html-api'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { hyphenize } from '../../../common'

export function formatDeleteAll (schema: Schema, relations: Struct<Schema>, options: Options): string {
  return `
import { CrudDeleteAllHandler } from '@scola/lib'

export class DeleteAllHandler extends CrudDeleteAllHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public object = '${options.object}'

  public url = '${options.url}/delete/all/${hyphenize(options.object)}'
}
`.trim()
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
