import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function select (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (field.values?.includes(data[name]) !== true) {
    errors[name] = {
      code: 'err_validator_bad_input_select',
      data: { values: field.values }
    }

    return false
  }

  return true
}
