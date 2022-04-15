import type { Schema } from '../../../server'
import { pickField } from './pick-field'

export function createInsertSchema (schema: Schema): Schema | undefined {
  const insertSchema = Object
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
    .filter(([,field]) => {
      return field.pkey === false
    })
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: pickField(field)
      }
    }, {})

  if (Object.keys(insertSchema).length === 0) {
    throw new Error('Schema is empty')
  }

  return insertSchema
}
