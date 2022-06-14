import type { SchemaField, Validator } from '../helpers'
import { ScolaError, isStruct } from '../../common'
import { SchemaValidator } from '../helpers'
import type { User } from '../../common'

export function fieldset (name: string, field: SchemaField): Validator {
  const schemaValidator = new SchemaValidator(field.schema ?? {})

  schemaValidator.compile()
  return async (data, errors, user?: User) => {
    let childErrors: ScolaError | null = null

    const values = data[name]

    if (isStruct(values)) {
      try {
        if (field.strict === true) {
          for (const key of Object.keys(values)) {
            if (field.schema?.[key] === undefined) {
              throw {
                code: 'err_validator_bad_input_fieldset',
                data: {
                  accept: Object.keys(field.schema ?? {})
                }
              } as unknown
            }
          }
        }

        await schemaValidator.validate(values, user)
      } catch (error: unknown) {
        childErrors = ScolaError.fromError(error)
      }
    } else {
      childErrors = new ScolaError({
        code: 'err_validator_bad_input_fieldset'
      })
    }

    if (childErrors !== null) {
      errors[name] = childErrors
      throw errors[name]
    }
  }
}
