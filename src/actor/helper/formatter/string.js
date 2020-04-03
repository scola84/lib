import isNil from 'lodash/isNil.js'
import { Formatter } from './formatter.js'

export class StringFormatter extends Formatter {
  format (value, options) {
    const {
      def = ''
    } = options

    if (isNil(value) === true) {
      return def
    }

    return String(value)
  }
}
