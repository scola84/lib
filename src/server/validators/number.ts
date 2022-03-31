import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function number (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    if (!Number.isFinite(data[name])) {
      errors[name] = {
        code: 'err_validator_bad_input_number'
      }

      return false
    }

    return true
  }
}
