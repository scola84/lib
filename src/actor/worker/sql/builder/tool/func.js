import camelCase from 'lodash/camelCase.js'
import { SqlSnippet } from './snippet/snippet.js'

const aggregate = [
  'AVG',
  'COUNT',
  'MAX',
  'MIN',
  'STDDEV_POP',
  'STDDEV_SAMP',
  'SUM',
  'VAR_POP',
  'VAR_SAMP'
]

const compare = [
  'COALESCE',
  'GREATEST',
  'LEAST',
  'NULLIF'
]

const math = [
  'ABS',
  'CEIL',
  'FLOOR',
  'POWER',
  'RAND',
  'ROUND',
  'SIGN',
  'SQRT',
  'TRUNCATE'
]

const misc = [
  'CAST',
  'NOW',
  'VALUES'
]

const string = [
  'CONCAT',
  'CONCAT_WS',
  'CONTAINS',
  'LEFT',
  'LENGTH',
  'LOWER',
  'LPAD',
  'LTRIM',
  'RIGHT',
  'RPAD',
  'RTRIM',
  'SUBSTRING',
  'TRIM',
  'UPPER'
]

const subquery = [
  'ALL',
  'EXISTS',
  'IN'
]

const list = [
  ...aggregate,
  ...compare,
  ...math,
  ...misc,
  ...string,
  ...subquery
]

export default list.reduce((object, token) => {
  return {
    ...object,
    [camelCase(token)]: {
      object: SqlSnippet,
      options: {
        name: token,
        parens: true,
        prefix: token
      }
    }
  }
}, {})
