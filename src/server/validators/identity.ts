import { ScolaError, isNil, isStruct } from '../../common'
import type { Validator } from '../helpers'

export function identity (name: string): Validator {
  return (data, errors) => {
    const value = data[name]

    if ((
      isStruct(value)
    ) && (
      isNil(value.identity_email) ||
      value.identity_email === ''
    ) && (
      isNil(value.identity_tel_national) ||
      value.identity_tel_national === ''
    ) && (
      isNil(value.identity_username) ||
      value.identity_username === ''
    )) {
      errors[name] = new ScolaError({
        code: 'err_validator_identity'
      })

      throw errors[name]
    }
  }
}
