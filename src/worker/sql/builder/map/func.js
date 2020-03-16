import camelCase from 'lodash/camelCase.js'
import { Snippet } from '../snippet/snippet.js'

const list = [
  'ABS',
  'AVG',
  'CAST',
  'CEIL',
  'COALESCE',
  'CONCAT',
  'CONCAT_WS',
  'CONTAINS',
  'COUNT',
  'FLOOR',
  'ISEMPTY',
  'LEFT',
  'LENGTH',
  'LOWER',
  'LPAD',
  'LTRIM',
  'MAX',
  'MIN',
  'NULLIF',
  'POWER',
  'RIGHT',
  'ROUND',
  'RPAD',
  'RTRIM',
  'STDDEV_POP',
  'STDDEV_SAMP',
  'SUBSTRING',
  'SUM',
  'TRIM',
  'UPPER',
  'VALUES',
  'VAR_POP',
  'VAR_SAMP'
]

export default list.reduce((object, token) => {
  return {
    ...object,
    [camelCase(token)]: {
      object: Snippet,
      options: {
        name: token,
        parens: true,
        prefix: token
      }
    }
  }
}, {})
