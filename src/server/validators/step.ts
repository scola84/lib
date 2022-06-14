import type { SchemaField, Validator } from '../helpers'
import { ScolaError } from '../../common'

export function step (name: string, field: SchemaField): Validator {
  return (data, errors) => {
    const value = Number(data[name])

    if ((value % (field.step ?? 0)) !== 0) {
      errors[name] = new ScolaError({
        code: 'err_validator_step_mismatch',
        data: {
          step: field.step
        }
      })

      throw errors[name]
    }
  }
}
