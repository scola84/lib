import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'

export function max (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    if (Number(data[name]) > (field.max ?? Infinity)) {
      errors[name] = {
        code: 'err_validator_range_overflow',
        data: { max: field.max }
      }

      return false
    }

    return true
  }
}
