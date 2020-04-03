import isString from 'lodash/isString.js'
import { Value } from '../escape/value.js'
import * as map from './date-template/index.js'

export class DateTemplate extends Value {
  resolveValueMysql (box, data, value) {
    return super.resolveValueMysql(box, data, this.replacePattern(value, map.mysql))
  }

  resolveValuePostgresql (box, data, value) {
    return super.resolveValuePostgresql(box, data, this.replacePattern(value, map.postgresql))
  }

  replacePattern (value, patterns) {
    const parts = value.split('-')
    let part = null

    for (let i = 0; i < parts.length; i += 1) {
      part = parts[i]

      if (isString(patterns[part]) === true) {
        parts[i] = patterns[part]
      }
    }

    return parts.join('-')
  }
}
