import { Dialect } from '../dialect.js'

export class Returning extends Dialect {
  mergeMysql (box, data, result) {
    if (result.insertId === undefined) {
      return result
    }

    const [id] = this._args

    if (typeof id !== 'string') {
      return result
    }

    return [{
      [id]: result.insertId
    }]
  }

  resolveMysql () {
    return ''
  }

  resolvePostgresql (box, data, value) {
    return `RETURNING ${value}`
  }
}
