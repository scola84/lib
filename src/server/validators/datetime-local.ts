import { cast, isDate } from '../../common'
import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function datetimeLocal (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = cast(data[name]) ?? ''

    if (!isDate(value)) {
      errors[name] = {
        code: 'err_validator_bad_input_date'
      }

      return false
    }

    return true
  }
}
