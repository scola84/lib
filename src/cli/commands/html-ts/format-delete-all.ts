import type { Schema } from '../../../server/helpers/schema'
import type { WriteOptions } from '../html-ts'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'
import { formatUrl } from './format-url'

export function formatDeleteAll (schema: Schema, options: WriteOptions): string {
  return `
import { CrudDeleteAllHandler } from '@scola/lib'

export class DeleteAllHandler extends CrudDeleteAllHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public url = '${formatUrl(options.url, options.name, 'delete/all', 'da')}'
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
