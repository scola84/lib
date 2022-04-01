import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { rejoin } from '../../../common'

export function formatDeleteAll (schema: Schema, options: Options): string {
  return `
import { CrudDeleteAllHandler } from '@scola/lib'

export class DeleteAllHandler extends CrudDeleteAllHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public url = '${options.url}/delete/all/${rejoin(options.object, '-')}'
}
`.trim()
}

function formatKeys (object: string, schema: Schema, space: number): string {
  const {
    auth,
    primary
  } = createKeys(object, schema)

  return formatCode(
    {
      auth,
      primary
    },
    space
  ).trimStart()
}
