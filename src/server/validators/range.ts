import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { cast } from '../../common'

export function range (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    if (!Number.isFinite(cast(data[name]))) {
      errors[name] = {
        code: 'err_validator_bad_input_range'
      }

      return false
    }

    return true
  }
}
