import type { SchemaField, Validator } from '../helpers'
import { ScolaError } from '../../common'

export function min (name: string, field: SchemaField): Validator {
  return (data, errors) => {
    const value = Number(data[name])

    if (value < (field.min ?? -Infinity)) {
      errors[name] = new ScolaError({
        code: 'err_validator_range_underflow',
        data: {
          min: field.min
        }
      })

      throw errors[name]
    }
  }
}
