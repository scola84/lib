import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import { cast } from '../../common'

export function minLength (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    const value = cast(data[name]) ?? ''

    if (value.toString().length < (field.minLength ?? -Infinity)) {
      errors[name] = {
        code: 'err_validator_too_short',
        data: { minLength: field.minLength }
      }

      return false
    }

    return true
  }
}
