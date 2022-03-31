import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import { isArray } from '../../common'

export function checkbox (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    const values = data[name]

    if (isArray(values)) {
      const included = values.every((value) => {
        return field.values?.includes(value) === true
      })

      if (!included) {
        errors[name] = {
          code: 'err_validator_bad_input_checkbox',
          data: { values: field.values }
        }

        return false
      }
    } else {
      errors[name] = {
        code: 'err_validator_bad_input_checkbox'
      }
    }

    return true
  }
}
