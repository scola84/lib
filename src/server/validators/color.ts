import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function color (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = String(data[name])

    if (!(/[a-f0-9]{7}/iu).test(value)) {
      errors[name] = {
        code: 'err_validator_bad_input_color'
      }

      return false
    }

    return true
  }
}
