import pgString from 'pg-escape'
import sqlstring from 'sqlstring'
import { Dialect } from '../dialect.js'

export class Value extends Dialect {
  resolveMysql (box, data, value) {
    return sqlstring.escape(value)
  }

  resolvePostgresql (box, data, value) {
    return pgString.dollarQuotedString(value)
  }
}
