import isNil from 'lodash/isNil.js'
import luxon from 'luxon'
import { Formatter } from './formatter.js'

export class DateFormatter extends Formatter {
  format (value, options, locale) {
    const {
      def = '',
      fmt = 'D',
      type = 'date'
    } = options

    if (isNil(value) === true) {
      return def
    }

    const loptions = {
      locale: locale.replace('_', '-')
    }

    const result = type === 'date'
      ? luxon.DateTime.fromJSDate(new Date(value), loptions)
      : luxon.Duration.fromMillis(value)

    return result.toFormat(fmt)
  }
}
