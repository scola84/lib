import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import { isArray } from '../../common'

export function selectMultiple (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    let values = data[name]

    if (
      !isArray(values) &&
      field.strict === false
    ) {
      values = [values]
    }

    if (isArray(values)) {
      const included = values.every((value) => {
        return field.values?.includes(value) === true
      })

      if (!included) {
        errors[name] = {
          code: 'err_validator_bad_input_selectmultiple',
          data: { accept: field.values }
        }

        throw errors[name]
      }
    } else {
      errors[name] = {
        code: 'err_validator_bad_input_selectmultiple'
      }

      throw errors[name]
    }
  }
}
