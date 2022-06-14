import { ScolaError } from '../../common'
import type { Validator } from '../helpers'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function telE164 (name: string): Validator {
  return (data, errors) => {
    const value = data[name]
    const phoneNumber = parsePhoneNumberFromString(String(value))

    if (phoneNumber?.isValid() !== true) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_tel'
      })

      throw errors[name]
    }

    data[name] = phoneNumber.format('E.164')
  }
}