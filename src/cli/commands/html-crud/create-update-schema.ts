import type { Schema } from '../../../server'
import { pickField } from './pick-field'

export function createUpdateSchema (schema: Schema): Schema | undefined {
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
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: pickField(field)
      }
    }, {})
}
