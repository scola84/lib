import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function telNational (name: string): Validator {
  const nameCountryCode = name.replace('-national', '-country-code')
  return (data: Struct) => {
    const value = `${String(data[nameCountryCode])}${String(data[name])}`

    if (typeof value === 'string') {
      const phoneNumber = parsePhoneNumberFromString(value)

      if (phoneNumber?.isValid() === true) {
        data[name] = phoneNumber.nationalNumber
      }
    }
  }
}
