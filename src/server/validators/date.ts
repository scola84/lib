import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function date (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (!Number.isFinite(Date.parse(String(data[name])))) {
    errors[name] = {
      code: 'err_validator_bad_input_date'
    }

    return false
  }

  return true
}
