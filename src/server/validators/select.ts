import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'

export function select (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    if (field.values?.includes(data[name]) !== true) {
      errors[name] = {
        code: 'err_validator_bad_input_select',
        data: { values: field.values }
      }

      return false
    }

    return true
  }
}