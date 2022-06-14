import { ScolaError } from '../../common'
import type { Validator } from '../helpers'

export function number (name: string): Validator {
  return (data, errors) => {
    if (!Number.isFinite(data[name])) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_number'
      })

      throw errors[name]
    }
  }
}
