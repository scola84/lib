import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function tel (name: string): Validator {
  return (data: Struct) => {
    const value = data[name]

    if (typeof value === 'string') {
      const phoneNumber = parsePhoneNumberFromString(value)

      if (phoneNumber?.isValid() === true) {
        data[name] = phoneNumber.format('E.164')
      }
    }
  }
}
