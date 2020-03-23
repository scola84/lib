import isNil from 'lodash/isNil.js'
import luxon from 'luxon'

export function date (value, options, locale) {
  if (isNil(value) === true) {
    return ''
  }

  const {
    fmt = 'D',
    type = 'dat'
  } = options

  const loptions = {
    locale: locale.replace('_', '-')
  }

  const result = type === 'dat'
    ? luxon.DateTime.fromJSDate(new Date(value), loptions)
    : luxon.Duration.fromMillis(value)

  return result.toFormat(fmt)
}
