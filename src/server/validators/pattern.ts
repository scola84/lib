import type { SchemaField, Validator } from '../helpers'
import { ScolaError } from '../../common'

export function pattern (name: string, field: SchemaField): Validator {
  return (data, errors) => {
    const value = String(data[name])

    if (field.pattern?.test(value) === false) {
      errors[name] = new ScolaError({
        code: 'err_validator_pattern_mismatch',
        data: {
          pattern: field.pattern.source
        }
      })

      throw errors[name]
    }
  }
}
