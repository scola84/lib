import camelCase from 'lodash/camelCase.js'
import { SqlSnippet } from '../snippet/snippet.js'

const control = [
  'DISTINCT',
  'FROM',
  'GROUP BY',
  'INTO',
  'LIMIT',
  'OFFSET',
  'ORDER BY',
  'SET',
  'USING',
  'WHERE'
]

const cte = [
  'RECURSIVE',
  'WITH'
]

const join = [
  'CROSS',
  'INNER',
  'JOIN',
  'LEFT',
  'NATURAL',
  'ON',
  'OUTER',
  'RIGHT'
]

const logic = [
  'CASE',
  'ELSE',
  'END',
  'NOT',
  'THEN',
  'WHEN'
]

const operation = [
  'DELETE',
  'INSERT',
  'REPLACE',
  'SELECT',
  'UPDATE'
]

const list = [
  ...control,
  ...cte,
  ...join,
  ...logic,
  ...operation
]

export default list.reduce((object, token) => {
  return {
    ...object,
    [camelCase(token)]: {
      object: SqlSnippet,
      options: {
        name: token,
        prefix: `${token} `
      }
    }
  }
}, {})
