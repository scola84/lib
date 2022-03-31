import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function email (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = String(data[name])

    if (!(/.+@.+/iu).test(value)) {
      errors[name] = {
        code: 'err_validator_bad_input_email'
      }

      return false
    }

    return true
  }
}
