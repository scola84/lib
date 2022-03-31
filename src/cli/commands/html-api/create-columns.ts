import type { Schema } from '../../../server/helpers'
import type { Struct } from '../../../common'

export function createColumns (schema: Schema, relations: Struct<Schema>): string[] {
  return [
    Object
      .entries(schema)
      .filter(([,field]) => {
        return field.rkey === undefined
      })
      .map(([column]) => {
        return column
      }),
    ...Object
      .entries(relations)
      .map(([table, tableSchema]) => {
        return Object
          .entries(tableSchema)
          .filter(([,field]) => {
            return field.rkey === undefined
          })
          .map(([column]) => {
            return `${table}.${column}`
          })
      })
  ].flat()
}
