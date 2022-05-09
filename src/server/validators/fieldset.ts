import type { SchemaField, Validator } from '../helpers'
import type { Struct, User } from '../../common'
import { SchemaValidator } from '../helpers'
import { isStruct } from '../../common'

export async function fieldset (name: string, field: SchemaField): Promise<Validator> {
  const schemaValidator = new SchemaValidator(field.schema ?? {})

  await schemaValidator.compile()
  return async (data: Struct, errors: Struct, user?: User) => {
    let childErrors: Struct | null = null

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
        childErrors = error as Struct
      }
    } else {
      childErrors = {
        code: 'err_validator_bad_input_fieldset'
      }
    }

    if (childErrors !== null) {
      errors[name] = childErrors
      throw errors[name]
    }
  }
}
