import { locale } from './locale'
import { telCountryCode } from './tel-country-code'
import { timeZone } from './time-zone'

export const selectGenerators = {
  'sc-locale': locale,
  'sc-tel-country-code': telCountryCode,
  'sc-time-zone': timeZone
}
