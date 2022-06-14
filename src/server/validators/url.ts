import { ScolaError } from '../../common'
import type { Validator } from '../helpers'

export function url (name: string): Validator {
  return (data, errors) => {
    const value = String(data[name])

    if (!(/.+:\/\/.+/iu).test(value.toString())) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_url'
      })

      throw errors[name]
    }
  }
}
