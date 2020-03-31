import isNil from 'lodash/isNil.js'
import { Formatter } from './formatter.js'

export class StringFormatter extends Formatter {
  format (value) {
    if (isNil(value) === true) {
      return ''
    }

    return String(value)
  }
}
