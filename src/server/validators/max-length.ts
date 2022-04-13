import type { SchemaField, Validator } from '../helpers'
import { isArray, isStruct } from '../../common'
import type { Struct } from '../../common'

export function maxLength (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    const value = data[name]

    if ((
      isStruct(value) &&
      Object.keys(value).length > (field.maxLength ?? Infinity)
    ) || (
      isArray(value) &&
      value.length > (field.maxLength ?? Infinity)
    ) || (
      String(value).length > (field.maxLength ?? Infinity)
    )) {
      errors[name] = {
        code: 'err_validator_too_long',
        data: { maxLength: field.maxLength }
      }

      return false
    }

    return true
  }
}
