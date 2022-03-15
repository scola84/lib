import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function minLength (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (String(data[name]).length < (field.minLength ?? -Infinity)) {
    errors[name] = {
      code: 'err_validator_too_short',
      data: { minLength: field.minLength }
    }

    return false
  }

  return true
}
