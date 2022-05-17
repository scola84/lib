import { isNil, isStruct } from '../../common'
import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function identity (name: string): Validator {
  return (data: Struct, errors: Struct) => {
    const value = data[name]

    if ((
      isStruct(value)
    ) && (
      isNil(value.identity_email) ||
      value.identity_email === ''
    ) && (
      isNil(value.identity_tel) ||
      value.identity_tel === ''
    ) && (
      isNil(value.identity_username) ||
      value.identity_username === ''
    )) {
      errors[name] = {
        code: 'err_validator_identity'
      }

      throw errors[name]
    }
  }
}
