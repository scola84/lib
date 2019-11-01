import { DateTime } from 'luxon'

export function l (value, options = '', locale = 'nl_NL') {
  const foptions = options === ''
    ? []
    : options.split(';')

  const [
    format = 'D'
  ] = foptions

  const loptions = {
    locale: locale.replace('_', '-')
  }

  return DateTime
    .fromISO(value)
    .toFormat(format, loptions)
}
