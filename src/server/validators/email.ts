import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function email (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (!(/.+@.+/iu).test(String(data[name]))) {
    errors[name] = {
      code: 'err_validator_bad_input_email'
    }

    return false
  }

  return true
}
