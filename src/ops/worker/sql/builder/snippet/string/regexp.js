import { Dialect } from '../dialect.js'

export class Regexp extends Dialect {
  resolveInfixMysql () {
    return ' REGEXP '
  }

  resolveInfixPostgresql () {
    return ' ~ '
  }
}
