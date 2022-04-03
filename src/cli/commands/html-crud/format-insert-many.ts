import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import { createKeys } from './create-keys'
import { createSelectSchema } from './create-select-schema'
import { formatCode } from './format-code'
import { pickField } from './pick-field'
import { toJoint } from '../../../common'

export function formatInsertMany (schema: Schema, options: Options): string {
  return `
import { CrudInsertManyHandler } from '@scola/lib'

export class InsertManyHandler extends CrudInsertManyHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudInsertManyHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)},
    query: ${formatQuerySchema(options.object, schema, 6)}
  }

  public url = '${options.url}/insert/many/${toJoint(options.object, '-')}'
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
      type: 'array'
    },
    space
  ).trimStart()
}

function formatKeys (object: string, schema: Schema, space: number): string {
  const {
    auth,
    foreign,
    primary,
    related
  } = createKeys(object, schema)

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

function formatQuerySchema (object: string, schema: Schema, space: number): string {
  return formatCode(
    {
      required: true,
      schema: {
        ...createSelectSchema(object, schema)
      },
      type: 'struct'
    },
    space
  ).trimStart()
}
