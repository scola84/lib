import { ScolaError } from '../../common'
import type { Validator } from '../helpers'

export function color (name: string): Validator {
  return (data, errors) => {
    const value = String(data[name])

    if (!(/[a-f0-9]{7}/iu).test(value)) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_color'
      })

      throw errors[name]
    }
  }
}
