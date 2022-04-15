import type { Schema } from '../../../server'
import { pickField } from './pick-field'

export function createUpdateSchema (schema: Schema): Schema | undefined {
  const updateSchema = Object
    .entries(schema)
    .filter(([,field]) => {
      return field.hidden === false
    })
    .filter(([,field]) => {
      return (
        field.readonly === false ||
        field.var !== undefined
      )
    })
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: pickField(field)
      }
    }, {})

  if (Object.keys(updateSchema).length === 0) {
    throw new Error('Schema is empty')
  }

  return updateSchema
}
