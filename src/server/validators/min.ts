import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import { cast } from '../../common'

export function min (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    const value = cast(data[name]) ?? ''

    if (Number(value) < (field.min ?? -Infinity)) {
      errors[name] = {
        code: 'err_validator_range_underflow',
        data: { min: field.min }
      }

      return false
    }

    return true
  }
}
