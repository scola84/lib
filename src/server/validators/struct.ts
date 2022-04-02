import type { SchemaField, Validator } from '../helpers'
import { SchemaValidator } from '../helpers'
import type { Struct } from '../../common'
import type { User } from '../entities'
import { isStruct } from '../../common'

export function struct (name: string, field: SchemaField, user?: User): Validator {
  const schemaValidator = new SchemaValidator(field.schema ?? {})

  function validator (data: Struct, errors: Struct): boolean {
    let childErrors: Struct | null = null

    const values = data[name]

    if (isStruct(values)) {
      try {
        const keys = Object.keys(values)

        if (keys.length > (field.maxLength ?? Infinity)) {
          childErrors = {
            code: 'err_validator_bad_input_struct',
            data: { maxLength: field.maxLength }
          }
        } else if (keys.length < (field.minLength ?? -Infinity)) {
          childErrors = {
            code: 'err_validator_bad_input_struct',
            data: { minLength: field.minLength }
          }
        } else if (field.strict === true) {
          keys.forEach((key) => {
            if (field.schema?.[key] === undefined) {
              throw {
                code: 'err_validator_bad_input_struct',
                data: { accept: Object.keys(field.schema ?? {}) }
              } as unknown as Error
            }
          })
        }

        schemaValidator.validate(values, user)
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
