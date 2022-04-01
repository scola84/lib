import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import { createFileFields } from './create-file-fields'
import { createModifiedFields } from './create-modified-fields'
import { createPrimaryFields } from './create-primary-fields'
import { formatCode } from './format-code'
import { formatKeys } from './format-keys'
import { pickField } from './pick-field'
import { rejoin } from '../../../common'
import { sortKeys } from './sort-keys'

export function formatSelectOne (schema: Schema, options: Options): string {
  return `
import { CrudSelectOneHandler } from '@scola/lib'

export class SelectOneHandler extends CrudSelectOneHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudSelectOneHandler['schema'] = {
    query: ${formatQuerySchema(schema, 6)}
  }

  public url = '${options.url}/select/one/${rejoin(options.object, '-')}'
}
`.trim()
}

function createQueryFields (schema: Schema): Schema {
  return sortKeys({
    ...createPrimaryFields(schema),
    ...createModifiedFields(schema),
    ...createFileFields(schema)
  })
}

function formatQuerySchema (schema: Schema, space: number): string {
  return formatCode(
    {
      required: true,
      schema: Object
        .entries(createQueryFields(schema))
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
