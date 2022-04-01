import type { SchemaField, Validator } from '../helpers'
import { isArray, isStruct } from '../../common'
import { SchemaValidator } from '../helpers'
import type { Struct } from '../../common'

export function array (name: string, field: SchemaField): Validator {
  const schemaValidator = new SchemaValidator(field.schema ?? {})

  function validator (data: Struct, errors: Struct): boolean {
    let childErrors: Struct | null = null
    let values = data[name]

    if (
      !isArray(values) &&
      field.strict !== true
    ) {
      values = [values]
    }

    if (isArray(values)) {
      if (field.schema !== undefined) {
        for (const value of values) {
          try {
            if (isStruct(value)) {
              schemaValidator.validate(value)
            } else {
              schemaValidator.validate({
                [name]: value
              })
            }
          } catch (error: unknown) {
            childErrors = error as Struct
            break
          }
        }
      }
    } else {
      childErrors = {
        code: 'err_validator_bad_input_array'
      }
    }

    if (childErrors === null) {
      return true
    }

    errors[name] = childErrors
    return false
  }

  return validator
}
