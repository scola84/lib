import type { SchemaField, Validator } from '../helpers'
import { SchemaValidator } from '../helpers'
import type { Struct } from '../../common'
import { isStruct } from '../../common'

export function struct (name: string, field: SchemaField): Validator {
  const schemaValidator = new SchemaValidator(field.schema ?? {})

  function validator (data: Struct, errors: Struct): boolean {
    let childErrors: Struct | null = null

    const childData = data[name]

    if (isStruct(childData)) {
      try {
        schemaValidator.validate(childData)
      } catch (error: unknown) {
        childErrors = error as Struct
      }
    } else {
      childErrors = {
        code: 'err_validator_bad_input_struct'
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
