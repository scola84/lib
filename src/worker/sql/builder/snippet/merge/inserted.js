import isFinite from 'lodash/isFinite.js'
import isString from 'lodash/isString.js'
import { Dialect } from '../dialect.js'

export class MergeInserted extends Dialect {
  mergeMysql (box, data, result = { rows: [] }) {
    if (isFinite(result.rows.insertId) === false) {
      return result
    }

    const id = this.resolveValue(box, data, this._args[0])

    if (isString(id) === false) {
      return result
    }

    result.rows = [{
      [id]: result.insertId
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
