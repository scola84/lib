import type { Schema } from '../../../server/helpers/schema'

export function createPrimaryFields (schema: Schema): Schema {
  return Object
    .entries(schema)
    .filter(([, field]) => {
      return field.pkey === true
    })
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: field
      }
    }, {})
}
