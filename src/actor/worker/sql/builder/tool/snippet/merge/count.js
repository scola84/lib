import { Dialect } from '../dialect.js'

export class MergeCount extends Dialect {
  mergeMysql (box, data, result = {}) {
    return {
      failure: 0,
      skipped: result.affectedRows - result.changedRows,
      success: result.changedRows,
      total: result.affectedRows
    }
  }

  mergePostgresql (box, data, result = {}) {
    return {
      failure: 0,
      skipped: 0,
      success: result.rowCount,
      total: result.rowCount
    }
  }
}
