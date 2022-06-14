import { ScolaError } from '../../common'
import type { Validator } from '../helpers'

export function boolean (name: string): Validator {
  const values: unknown[] = [
    false,
    true
  ]

  return (data, errors) => {
    if (typeof data[name] !== 'boolean') {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_boolean',
        data: {
          accept: values
        }
      })

      throw errors[name]
    }
  }
}
