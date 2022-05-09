import type { SchemaField, Validator } from '../helpers'
import { isArray, isStruct } from '../../common'
import { SchemaValidator } from '../helpers'
import type { Struct } from '../../common'

export async function array (name: string, field: SchemaField): Promise<Validator> {
  const schemaValidator = new SchemaValidator(field.schema ?? {})

  await schemaValidator.compile()
  return async (data: Struct, errors: Struct) => {
    let childErrors: Struct | null = null
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
        childErrors = error as Struct
      }
    } else {
      childErrors = {
        code: 'err_validator_bad_input_array'
      }
    }

    if (childErrors !== null) {
      errors[name] = childErrors
      throw errors[name] as Error
    }
  }
}
