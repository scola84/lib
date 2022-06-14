import type { SchemaField, Validator } from '../helpers'
import { ScolaError, isArray, isStruct } from '../../common'

export function maxLength (name: string, field: SchemaField): Validator {
  return (data, errors) => {
    const value = data[name]

    if ((
      isStruct(value) &&
      Object.keys(value).length > (field.maxLength ?? Infinity)
    ) || (
      isArray(value) &&
      value.length > (field.maxLength ?? Infinity)
    ) || (
      String(value).length > (field.maxLength ?? Infinity)
    )) {
      errors[name] = new ScolaError({
        code: 'err_validator_too_long',
        data: {
          maxLength: field.maxLength
        }
      })

      throw errors[name]
    }
  }
}
