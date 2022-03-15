import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function color (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (!(/[a-f0-9]{7}/iu).test(String(data[name]))) {
    errors[name] = {
      code: 'err_validator_bad_input_color'
    }

    return false
  }

  return true
}
