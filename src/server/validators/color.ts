import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { cast } from '../../common'

export function color (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = cast(data[name]) ?? ''

    if (!(/[a-f0-9]{7}/iu).test(value.toString())) {
      errors[name] = {
        code: 'err_validator_bad_input_color'
      }

      return false
    }

    return true
  }
}
