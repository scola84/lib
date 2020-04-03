import isPlainObject from 'lodash/isPlainObject.js'
import pgEscape from 'pg-escape'
import sqlstring from 'sqlstring'
import { Dialect } from '../dialect.js'

export class Value extends Dialect {
  resolveValueMysql (box, data, value) {
    return sqlstring.escape(this.stringify(value))
  }

  resolveValuePostgresql (box, data, value) {
    return pgEscape.literal(this.stringify(value))
  }

  stringify (value) {
    return isPlainObject(value)
      ? JSON.stringify(value)
      : String(value)
  }
}
