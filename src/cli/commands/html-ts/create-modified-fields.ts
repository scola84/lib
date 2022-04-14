import type { Schema } from '../../../server/helpers/schema'

export function createModifiedFields (schema: Schema): Schema {
  return Object
    .entries(schema)
    .filter(([, field]) => {
      return field.mkey === true
    })
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: field
      }
    }, {})
}
