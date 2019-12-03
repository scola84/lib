import { DateTime, Duration } from 'luxon'

export function l (value, options = '', locale = 'nl_NL') {
  const foptions = options === ''
    ? []
    : options.split(';')

  const [
    format = 'D',
    type = 'dat'
  ] = foptions

  const loptions = {
    locale: locale.replace('_', '-')
  }

  const date = type === 'dat'
    ? DateTime.fromJSDate(new Date(value), loptions)
    : Duration.fromMillis(value)

  return date.toFormat(format)
}
