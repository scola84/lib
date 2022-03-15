import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'
import { isArray } from '../../common'

export function checkbox (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
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
        code: 'err_validator_bad_input_checkbox',
        data: { values: field.values }
      }

      return false
    }
  }

  return true
}
