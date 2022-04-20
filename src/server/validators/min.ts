import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'

export function min (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    const value = Number(data[name])

    if (value < (field.min ?? -Infinity)) {
      errors[name] = {
        code: 'err_validator_range_underflow',
        data: { min: field.min }
      }

      throw errors[name]
    }
  }
}
