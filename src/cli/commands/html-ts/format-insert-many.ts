import type { Schema } from '../../../server/helpers/schema'
import type { WriteOptions } from '../html-ts'
import { createInsertSchema } from './create-insert-schema'
import { createKeys } from './create-keys'
import { createSelectSchema } from './create-select-schema'
import { formatCode } from './format-code'
import { formatUrl } from './format-url'

export function formatInsertMany (schema: Schema, options: WriteOptions): string {
  return `
import { CrudInsertManyHandler } from '@scola/lib'

export class InsertManyHandler extends CrudInsertManyHandler {
  public keys = ${formatKeys(options.object, schema, 4)}

  public object = '${options.object}'

  public schema: CrudInsertManyHandler['schema'] = {
    body: ${formatBodySchema(schema, 6)},
    query: ${formatQuerySchema(options.object, schema, 6)}
  }

  public url = '${formatUrl(options.url, options.name, 'insert/many', 'im')}'
}
`.trim()
}

function formatBodySchema (schema: Schema, space: number): string {
  return formatCode(
    {
      required: true,
      schema: createInsertSchema(schema),
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
      type: 'fieldset'
    },
    space
  ).trimStart()
}