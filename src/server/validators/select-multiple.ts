import type { SchemaField, SchemaValidator, Validator } from '../helpers'
import type { Struct } from '../../common'
import { isArray } from '../../common'

export async function selectMultiple (name: string, field: SchemaField, validator: SchemaValidator): Promise<Validator> {
  let fieldValues = field.values

  if (field.generator !== undefined) {
    fieldValues = (await validator.generators[field.generator]?.())?.map(([value]) => {
      return value
    })
  }

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
        return fieldValues?.includes(value) === true
      })

      if (!included) {
        errors[name] = {
          code: 'err_validator_bad_input_selectmultiple',
          data: {
            accept: fieldValues
          }
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
