import { ScolaError } from '../../common'
import type { Validator } from '../helpers'

export function email (name: string): Validator {
  return (data, errors) => {
    const value = String(data[name])

    if (!(/.+@.+/iu).test(value)) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_email'
      })

      throw errors[name]
    }
  }
}
