import { Dialect } from '../dialect.js'

export class Returning extends Dialect {
  mergeMysql (box, data, result = { rows: [] }) {
    if (result.rows.insertId === undefined) {
      return result
    }

    const id = this.resolveValue(box, data, this._args[0])

    if (typeof id !== 'string') {
      return result
    }

    result.rows = [{
      [id]: result.insertId
    }]

    return result
  }

  resolveMysql () {
    return ''
  }

  resolvePostgresql (box, data, value) {
    return `RETURNING ${value}`
  }
}
