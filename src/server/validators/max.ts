import type { SchemaField, Validator } from '../helpers'
import { ScolaError } from '../../common'

export function max (name: string, field: SchemaField): Validator {
  return (data, errors) => {
    const value = Number(data[name])

    if (value > (field.max ?? Infinity)) {
      errors[name] = new ScolaError({
        code: 'err_validator_range_overflow',
        data: {
          max: field.max
        }
      })

      throw errors[name]
    }
  }
}
