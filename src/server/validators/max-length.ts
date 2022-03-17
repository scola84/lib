import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import { cast } from '../../common'

export function maxLength (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    const value = cast(data[name]) ?? ''

    if (value.toString().length > (field.maxLength ?? Infinity)) {
      errors[name] = {
        code: 'err_validator_too_long',
        data: { maxLength: field.maxLength }
      }

      return false
    }

    return true
  }
}
