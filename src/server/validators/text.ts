import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function text (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    if (typeof data[name] !== 'string') {
      errors[name] = {
        code: 'err_validator_bad_input_text'
      }

      return false
    }

    return true
  }
}
