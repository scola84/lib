import { ScolaError, isPrimitive } from '../../common'
import type { Validator } from '../helpers'

export function password (name: string): Validator {
  return (data, errors) => {
    const value = data[name]

    if (!isPrimitive(value)) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_password'
      })

      throw errors[name]
    }

    data[name] = value.toString()
  }
}
