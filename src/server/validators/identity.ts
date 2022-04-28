import { isNil, isStruct } from '../../common'
import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function identity (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = data[name]

    if ((
      isStruct(value)
    ) && (
      isNil(value.email) ||
      value.email === ''
    ) && (
      isNil(value.tel) ||
      value.tel === ''
    ) && (
      isNil(value.username) ||
      value.username === ''
    )) {
      errors[name] = {
        code: 'err_validator_identity'
      }

      throw errors[name]
    }
  }
}
