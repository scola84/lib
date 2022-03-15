import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function maxLength (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (String(data[name]).length > (field.maxLength ?? Infinity)) {
    errors[name] = {
      code: 'err_validator_too_long',
      data: { maxLength: field.maxLength }
    }

    return false
  }

  return true
}
