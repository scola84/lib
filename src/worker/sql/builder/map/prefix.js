const list = [
  'ALL',
  'CROSS',
  'DELETE',
  'DISTINCT',
  'DISTINCTROW',
  'DELAYED',
  'GROUP BY',
  'HAVING',
  'HIGH_PRIORITY',
  'IGNORE',
  'INNER',
  'INSERT',
  'INTO',
  'JOIN',
  'LEFT',
  'LIMIT',
  'LOW_PRIORITY',
  'NATURAL',
  'ON',
  'ORDER BY',
  'OUTER',
  'PARTITION',
  'PARTITION BY',
  'QUICK',
  'RECURSIVE',
  'REPLACE',
  'RIGHT',
  'SELECT',
  'SET',
  'STRAIGHT_JOIN',
  'SQL_CALC_FOUND_ROWS',
  'SQL_BIG_RESULT',
  'SQL_BUFFER_RESULT',
  'SQL_NO_CACHE',
  'SQL_SMALL_RESULT',
  'UPDATE',
  'USING',
  'WINDOW',
  'WITH',
  'WHERE'
]

export default [
  ...list.map((token) => {
    return {
      name: token,
      token: `${token} `
    }
  })
]
