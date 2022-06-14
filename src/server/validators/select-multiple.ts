import type { SchemaField, SchemaValidator, Validator } from '../helpers'
import { ScolaError, cast, isArray } from '../../common'

export function selectMultiple (name: string, field: SchemaField, validator: SchemaValidator): Validator {
  let fieldValues = field.values

  if (field.generator !== undefined) {
    fieldValues = validator.generators[field.generator]?.()?.map(([value]) => {
      return cast(value)
    })
  }

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
        return fieldValues?.includes(value) === true
      })

      if (!included) {
        errors[name] = new ScolaError({
          code: 'err_validator_bad_input_selectmultiple',
          data: {
            accept: fieldValues
          }
        })

        throw errors[name]
      }
    } else {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_selectmultiple'
      })

      throw errors[name]
    }
  }
}
