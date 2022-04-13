import type { Options } from '../html-crud'
import type { Schema } from '../../../server/helpers/schema'
import { createInsertSchema } from './create-insert-schema'
import { createKeys } from './create-keys'
import { createSelectSchema } from './create-select-schema'
import { formatCode } from './format-code'
import { toJoint } from '../../../common'

export function formatInsertOne (schema: Schema, options: Options): string {
  return `
import { CrudInsertOneHandler } from '@scola/lib'

export class InsertOneHandler extends CrudInsertOneHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudInsertOneHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)},
    query: ${formatQuerySchema(options.object, schema, 6)}
  }

  public url = '${options.url}/insert/one/${toJoint(options.object, {
    separator: '-'
  })}'
}
`.trim()
}

function formatBodySchema (schema: Schema, space: number): string {
  return formatCode(
    {
      required: true,
      schema: createInsertSchema(schema),
      type: 'fieldset'
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
      type: 'fieldset'
    },
    space
  ).trimStart()
}
