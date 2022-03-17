import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'

export function min (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    if (Number(data[name]) < (field.min ?? -Infinity)) {
      errors[name] = {
        code: 'err_validator_range_underflow',
        data: { min: field.min }
      }

      return false
    }

    return true
  }
}
