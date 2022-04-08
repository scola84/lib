import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function datetimeLocal (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = data[name]

    if (!(value instanceof Date)) {
      errors[name] = {
        code: 'err_validator_bad_input_datetimelocal'
      }

      return false
    }

    return true
  }
}
