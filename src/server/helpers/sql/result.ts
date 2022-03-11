/**
 * The value of an ID column
 */
export type SqlId = number | string

/**
 * The result of a DELETE query.
 */
export interface SqlDeleteResult {
  /**
   * The number of affected rows.
   */
  count: number
}

/**
 * The result of an INSERT query.
 */
export interface SqlInsertResult<Id = SqlId | undefined> {
  /**
   * The id of the inserted row.
   */
  id: Id
}

/**
 * The result of an UPDATE query.
 */
export interface SqlUpdateResult {
  /**
   * The number of affected rows.
   */
  count: number
}
