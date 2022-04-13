import type { SchemaField, Validator } from '../helpers'
import { SchemaValidator } from '../helpers'
import type { Struct } from '../../common'
import type { User } from '../entities'
import { isStruct } from '../../common'

export function fieldset (name: string, field: SchemaField, user?: User): Validator {
  const schemaValidator = new SchemaValidator(field.schema ?? {})

  function validator (data: Struct, errors: Struct): boolean {
    let childErrors: Struct | null = null

    const values = data[name]

    if (isStruct(values)) {
      try {
        if (field.strict === true) {
          for (const key of Object.keys(values)) {
            if (field.schema?.[key] === undefined) {
              throw {
                code: 'err_validator_bad_input_fieldset',
                data: { accept: Object.keys(field.schema ?? {}) }
              } as unknown
            }
          }
        }

        schemaValidator.validate(values, user)
      } catch (error: unknown) {
        childErrors = error as Struct
      }
    } else {
      childErrors = {
        code: 'err_validator_bad_input_fieldset'
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
