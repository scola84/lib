import type { Schema } from '../../../server/helpers/schema'
import { createKeys } from './create-keys'
import { formatCode } from './format-code'

export function formatKeys (object: string, schema: Schema, space: number): string {
  const {
    auth,
    modified,
    primary
  } = createKeys(object, schema)

  return formatCode(
    {
      auth,
      modified,
      primary
    },
    space
  ).trimStart()
}
