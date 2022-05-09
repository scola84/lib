import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function boolean (name: string): Validator {
  const values: unknown[] = [
    false,
    true
  ]

  return (data: Struct, errors: Struct) => {
    if (typeof data[name] !== 'boolean') {
      errors[name] = {
        code: 'err_validator_bad_input_boolean',
        data: {
          accept: values
        }
      }

      throw errors[name]
    }
  }
}
