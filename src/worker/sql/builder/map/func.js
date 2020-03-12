import camelCase from 'lodash/camelCase.js'
import { Snippet } from '../snippet/snippet.js'

const list = [
  'ABS',
  'AVG',
  'BIN',
  'BIT_AND',
  'BIT_COUNT',
  'BIT_LENGTH',
  'BIT_OR',
  'BIT_XOR',
  'CAST',
  'CEIL',
  'COALESCE',
  'CONCAT',
  'CONCAT_WS',
  'CONTAINS',
  'COUNT',
  'FLOOR',
  'FORMAT',
  'GROUP_CONCAT',
  'IF',
  'IFNULL',
  'ISEMPTY',
  'ISNULL',
  'ISSIMPLE',
  'LEFT',
  'LENGTH',
  'LOWER',
  'LPAD',
  'LTRIM',
  'MAX',
  'MIN',
  'NOW',
  'NULLIF',
  'POW',
  'POWER',
  'REPLACE',
  'REVERSE',
  'RIGHT',
  'ROUND',
  'RPAD',
  'RTRIM',
  'SET',
  'STD',
  'STDDEV',
  'STDDEV_POP',
  'STDDEV_SAMP',
  'SUBSTR',
  'SUBSTRING',
  'SUM',
  'TRIM',
  'UNIX_TIMESTAMP',
  'UPPER',
  'VALUES',
  'VARIANCE',
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
