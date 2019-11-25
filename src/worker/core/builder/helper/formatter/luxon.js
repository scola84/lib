import { DateTime } from 'luxon'

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

  let date = DateTime
    .fromJSDate(new Date(value), loptions)

  if (type === 'dur') {
    date = date.diffNow()
  }

  return date.toFormat(format)
}
