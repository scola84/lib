import camelCase from 'lodash/camelCase.js'
import { SqlSnippet } from '../snippet/snippet.js'

const aggregation = [
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

const date = [
  'NOW'
]

const control = [
  'VALUES'
]

const logic = [
  'COALESCE',
  'ISEMPTY',
  'NULLIF'
]

const number = [
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

const type = [
  'CAST'
]

const list = [
  ...aggregation,
  ...control,
  ...date,
  ...logic,
  ...number,
  ...string,
  ...subquery,
  ...type
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
