import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { isDate } from '../../common'

export function date (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = data[name]

    if (!isDate(value)) {
      errors[name] = {
        code: 'err_validator_bad_input_date'
      }

      return false
    }

    return true
  }
}
