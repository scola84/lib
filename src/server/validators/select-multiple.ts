import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import { isArray } from '../../common'

export function selectMultiple (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    let values = data[name]

    if (!isArray(values)) {
      values = [values]
    }

    if (isArray(values)) {
      const included = values.every((value) => {
        return field.values?.includes(value) === true
      })

      if (!included) {
        errors[name] = {
          code: 'err_validator_bad_input_selectall',
          data: { values: field.values }
        }

        return false
      }
    }

    return true
  }
}
