import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function url (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (!(/.+:\/\/.+/iu).test(String(data[name]))) {
    errors[name] = {
      code: 'err_validator_bad_input_url'
    }

    return false
  }

  return true
}
