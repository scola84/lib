import { ScolaError } from '../../common'
import type { Validator } from '../helpers'

export function datetimeLocal (name: string): Validator {
  return (data, errors) => {
    const value = data[name]

    if (!(value instanceof Date)) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_datetimelocal'
      })

      throw errors[name]
    }
  }
}
