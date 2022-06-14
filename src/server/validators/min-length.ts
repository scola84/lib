import type { SchemaField, Validator } from '../helpers'
import { ScolaError, isArray, isStruct } from '../../common'

export function minLength (name: string, field: SchemaField): Validator {
  return (data, errors) => {
    const value = data[name]

    if ((
      isStruct(value) &&
      Object.keys(value).length < (field.minLength ?? -Infinity)
    ) || (
      isArray(value) &&
      value.length < (field.minLength ?? -Infinity)
    ) || (
      String(value).length < (field.minLength ?? -Infinity)
    )) {
      errors[name] = new ScolaError({
        code: 'err_validator_too_short',
        data: {
          minLength: field.minLength
        }
      })

      throw errors[name]
    }
  }
}
