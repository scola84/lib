import { Dialect } from '../dialect.js'

export class MergeUpdated extends Dialect {
  mergeMysql (box, data, result = {}) {
    return {
      count: result.changedRows
    }
  }

  mergePostgresql (box, data, result = {}) {
    return {
      count: result.rowCount
    }
  }
}
