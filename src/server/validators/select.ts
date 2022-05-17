import type { SchemaField, SchemaValidator, Validator } from '../helpers'
import type { Struct } from '../../common'
import { cast } from '../../common'

export function select (name: string, field: SchemaField, validator: SchemaValidator): Validator {
  let fieldValues = field.values

  if (field.generator !== undefined) {
    fieldValues = validator.generators[field.generator]?.()?.map(([value]) => {
      return cast(value)
    })
  }

  return (data: Struct, errors: Struct) => {
    if (fieldValues?.includes(data[name]) !== true) {
      errors[name] = {
        code: 'err_validator_bad_input_select',
        data: {
          accept: fieldValues
        }
      }

      throw errors[name]
    }
  }
}
