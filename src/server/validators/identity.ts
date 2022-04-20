import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { isStruct } from '../../common'

export function identity (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = data[name]

    if (
      isStruct(value) &&
      value.email === undefined &&
      value.tel === undefined &&
      value.username === undefined
    ) {
      errors[name] = {
        code: 'err_validator_identity'
      }

      throw errors[name]
    }
  }
}
