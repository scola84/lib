import pgString from 'pg-escape'
import sqlstring from 'sqlstring'
import { Dialect } from '../dialect.js'

export class Value extends Dialect {
  resolveValueMysql (box, data, value) {
    return sqlstring.escape(value)
  }

  resolveValuePostgresql (box, data, value) {
    return pgString.dollarQuotedString(value)
  }
}
