import { Dialect } from '../dialect.js'

export class FormatUnixTime extends Dialect {
  resolvePrefixMysql () {
    return 'FROM_UNIXTIME'
  }

  resolvePrefixPostgresql () {
    return 'TO_CHAR(DATE(TO_TIMESTAMP'
  }

  resolvePostfixPostgresql () {
    return '))'
  }

  setParens (value = true) {
    return super.setParens(value)
  }
}
