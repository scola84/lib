import type { Options } from './options'
import type { Schema } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'
import { createKeys } from './create-keys'
import { createPrimaryFields } from './create-primary-fields'
import { formatCode } from './format-code'
import { pickField } from './pick-field'
import { sortKeys } from './sort-keys'

export function formatGet (options: Options, schema: Schema, relations: Struct<Schema>): string {
  return `
import { RestGetHandler } from '@scola/lib'

export class GetHandler extends RestGetHandler {
  public keys = ${formatKeys(options.object, schema, relations, 4)}

  public method = 'GET'

  public object = '${options.object}'

  public schema = {
    query: ${formatQuerySchema(schema, 6)}
  }

  public url = '${options.url}'
}
`.trim()
}

function createFileFields (schema: Schema): Schema {
  const fields = Object
    .entries(schema)
    .filter(([, field]) => {
      return field.type === 'file'
    })

  if (fields.length === 0) {
    return {}
  }

  return fields
    .reduce((result, [name]) => {
      result.file.values.push(name as never)
      return result
    }, {
      file: {
        type: 'select',
        values: []
      }
    })
}

function createQueryFields (schema: Schema): Schema {
  return sortKeys({
    ...createPrimaryFields(schema),
    ...createFileFields(schema)
  })
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

function formatQuerySchema (schema: Schema, space: number): string {
  return formatCode(
    Object
      .entries(createQueryFields(schema))
      .reduce((result, [name, field]) => {
        return {
          ...result,
          [name]: pickField(field)
        }
      }, {}),
    space
  ).trimStart()
}
