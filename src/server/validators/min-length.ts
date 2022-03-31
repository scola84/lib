import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'

export function minLength (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    const value = String(data[name])

    if (value.length < (field.minLength ?? -Infinity)) {
      errors[name] = {
        code: 'err_validator_too_short',
        data: { minLength: field.minLength }
      }

      return false
    }

    return true
  }
}
