import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function min (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (Number(data[name]) < (field.min ?? -Infinity)) {
    errors[name] = {
      code: 'err_validator_range_underflow',
      data: { min: field.min }
    }

    return false
  }

  return true
}
