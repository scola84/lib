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
 * The result of an UPDATE query.
 */
export interface SqlUpdateResult {
  /**
   * The number of affected rows.
   */
  count: number
}
