import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function url (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = String(data[name])

    if (!(/.+:\/\/.+/iu).test(value.toString())) {
      errors[name] = {
        code: 'err_validator_bad_input_url'
      }

      return false
    }

    return true
  }
}
