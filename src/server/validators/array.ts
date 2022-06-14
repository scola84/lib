import type { SchemaField, Validator } from '../helpers'
import { ScolaError, isArray, isStruct } from '../../common'
import { SchemaValidator } from '../helpers'

export function array (name: string, field: SchemaField): Validator {
  const schemaValidator = new SchemaValidator(field.schema ?? {})

  schemaValidator.compile()
  return async (data, errors) => {
    let childErrors: ScolaError | null = null
    let values = data[name]

    if (
      !isArray(values) &&
      field.strict === false
    ) {
      values = [values]
    }

    if (isArray(values)) {
      try {
        await Promise.all(values.map(async (value) => {
          if (isStruct(value)) {
            await schemaValidator.validate(value)
          } else {
            await schemaValidator.validate({
              [name]: value
            })
          }
        }))
      } catch (error: unknown) {
        childErrors = ScolaError.fromError(error)
      }
    } else {
      childErrors = new ScolaError({
        code: 'err_validator_bad_input_array'
      })
    }

    if (childErrors !== null) {
      errors[name] = childErrors
      throw errors[name] as Error
    }
  }
}
