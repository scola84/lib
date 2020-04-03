import isFinite from 'lodash/isFinite.js'
import { Dialect } from '../dialect.js'

export class MergeId extends Dialect {
  mergeMysql (box, data, result = {}) {
    if (isFinite(result.insertId) === false) {
      return []
    }

    result.rows = [{
      [this._args[0]]: result.insertId
    }]

    return result
  }

  resolveValueMysql () {
    return ''
  }

  resolveValuePostgresql (box, data, value) {
    return `RETURNING ${value}`
  }
}
