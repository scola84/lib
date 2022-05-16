import { locale } from './locale'
import { telCountryCode } from './tel-country-code'
import { theme } from './theme'
import { timeZone } from './time-zone'

export const selectGenerators = {
  'sc-locale': locale,
  'sc-tel-country-code': telCountryCode,
  'sc-theme': theme,
  'sc-time-zone': timeZone
}
