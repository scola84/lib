import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { cast } from '../../common'

export function time (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = cast(data[name]) ?? ''

    if (!Number.isFinite(Date.parse(value.toString()))) {
      errors[name] = {
        code: 'err_validator_bad_input_time'
      }

      return false
    }

    return true
  }
}
