import { ScolaError, isPrimitive } from '../../common'
import type { Validator } from '../helpers'

export function text (name: string): Validator {
  return (data, errors) => {
    const value = data[name]

    if (!isPrimitive(value)) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_text'
      })

      throw errors[name]
    }

    data[name] = value.toString()
  }
}
