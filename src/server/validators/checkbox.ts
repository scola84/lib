import type { SchemaField, Validator } from '../helpers'
import { ScolaError, isArray } from '../../common'

export function checkbox (name: string, field: SchemaField): Validator {
  return (data, errors) => {
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
        errors[name] = new ScolaError({
          code: 'err_validator_bad_input_checkbox',
          data: {
            accept: field.values
          }
        })

        throw errors[name]
      }
    } else {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_checkbox'
      })

      throw errors[name]
    }
  }
}
