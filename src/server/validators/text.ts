import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { isPrimitive } from '../../common'

export function text (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = data[name]

    if (!isPrimitive(value)) {
      errors[name] = {
        code: 'err_validator_bad_input_text'
      }

      throw errors[name]
    }

    data[name] = value.toString()
  }
}
