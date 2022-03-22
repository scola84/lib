import { cast, isDate } from '../../common'
import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function time (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = cast(data[name]) ?? ''

    if (!isDate(value)) {
      errors[name] = {
        code: 'err_validator_bad_input_time'
      }

      return false
    }

    return true
  }
}
