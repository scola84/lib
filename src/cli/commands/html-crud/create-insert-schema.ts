import type { Schema } from '../../../server'
import { pickField } from './pick-field'

export function createInsertSchema (schema: Schema): Schema | undefined {
  return Object
    .entries(schema)
    .filter(([,field]) => {
      return field.hidden === false
    })
    .filter(([,field]) => {
      return (
        field.readonly === false ||
        field.required === true
      )
    })
    .filter(([,field]) => {
      return field.pkey === false
    })
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: pickField(field)
      }
    }, {})
}
