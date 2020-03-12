import camelCase from 'lodash/camelCase.js'
import { Snippet } from '../snippet/snippet.js'

const list = [
  'ALL',
  'CROSS',
  'DELETE',
  'DISTINCT',
  'FROM',
  'GROUP BY',
  'HAVING',
  'INNER',
  'INSERT',
  'INTO',
  'JOIN',
  'LEFT',
  'LIMIT',
  'NATURAL',
  'ON',
  'ORDER BY',
  'OUTER',
  'REPLACE',
  'RIGHT',
  'SELECT',
  'SET',
  'UPDATE',
  'USING',
  'WITH',
  'WHERE'
]

export default list.reduce((object, token) => {
  return {
    ...object,
    [camelCase(token)]: {
      object: Snippet,
      options: {
        name: token,
        prefix: `${token} `
      }
    }
  }
}, {})
