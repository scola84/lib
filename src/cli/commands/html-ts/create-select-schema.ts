import type { Schema } from '../../../server/helpers'
import type { Struct } from '../../../common'
import { sortKeys } from './sort-keys'

export function createSelectSchema (object: string, schema: Schema, relations: Struct<Schema> = {}): Schema | undefined {
  let selectSchema = sortKeys<Schema>({
    [object]: {
      schema: Object
        .entries(schema)
        .filter(([,field]) => {
          return field.hidden === false
        })
        .reduce((result, [name]) => {
          return {
            ...result,
            [name]: {
              type: 'boolean'
            }
          }
        }, {}),
      strict: true,
      type: 'fieldset'
    },
    ...Object
      .entries(relations)
      .reduce((tableResult, [tableName, tableSchema]) => {
        return {
          ...tableResult,
          [tableName]: {
            schema: Object
              .entries(tableSchema)
              .filter(([,field]) => {
                return field.hidden === false
              })
              .reduce((result, [name]) => {
                return {
                  ...result,
                  [name]: {
                    type: 'boolean'
                  }
                }
              }, {}),
            strict: true,
            type: 'fieldset'
          }
        }
      }, {})
  })

  if (Object.keys(relations).length === 0) {
    selectSchema = selectSchema[object].schema ?? {}
  }

  const hasFields = Object
    .values(selectSchema)
    .some((tableSchema) => {
      return Object.keys(tableSchema).length > 0
    })

  if (!hasFields) {
    return undefined
  }

  return {
    select: {
      schema: selectSchema,
      strict: true,
      type: 'fieldset'
    }
  }
}
