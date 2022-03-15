import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function textarea (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (typeof data[name] !== 'string') {
    errors[name] = {
      code: 'err_validator_bad_input_textarea'
    }

    return false
  }

  return true
}
