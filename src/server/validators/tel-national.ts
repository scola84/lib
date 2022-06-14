import { ScolaError } from '../../common'
import type { Validator } from '../helpers'
import parsePhoneNumber from 'libphonenumber-js'

export function telNational (name: string): Validator {
  const nameCountryCode = name.replace('_national', '_country_code')
  return (data, errors) => {
    const value = `+${String(data[nameCountryCode])} ${String(data[name])}`
    const phoneNumber = parsePhoneNumber(value)

    if (phoneNumber?.isValid() !== true) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_tel'
      })

      throw errors[name]
    }

    data[name] = phoneNumber.nationalNumber
  }
}
