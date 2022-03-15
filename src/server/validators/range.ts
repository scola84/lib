import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'
import { cast } from '../../common'

export function range (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (!Number.isFinite(cast(data[name]))) {
    errors[name] = {
      code: 'err_validator_bad_input_range'
    }

    return false
  }

  return true
}
