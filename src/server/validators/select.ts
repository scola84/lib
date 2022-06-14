import type { SchemaField, SchemaValidator, Validator } from '../helpers'
import { ScolaError, cast } from '../../common'

export function select (name: string, field: SchemaField, validator: SchemaValidator): Validator {
  let fieldValues = field.values

  if (field.generator !== undefined) {
    fieldValues = validator.generators[field.generator]?.()?.map(([value]) => {
      return cast(value)
    })
  }

  return (data, errors) => {
    if (fieldValues?.includes(data[name]) !== true) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_select',
        data: {
          accept: fieldValues
        }
      })

      throw errors[name]
    }
  }
}
