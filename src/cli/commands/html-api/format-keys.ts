import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'

export function formatKeys (object: string, schema: Schema, relations: Struct<Schema>, space: number): string {
  const {
    auth,
    modified,
    primary
  } = createKeys(object, schema, relations)

  return formatCode(
    {
      auth,
      modified,
      primary
    },
    space
  ).trimStart()
}
