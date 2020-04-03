import camelCase from 'lodash/camelCase.js'
import { SqlSnippet } from '../snippet/snippet.js'

const compare = [
  'IS NOT NULL',
  'IS NULL'
]

const date = [
  'DATE',
  'TIME',
  'TIMESTAMP'
]

const number = [
  'DECIMAL',
  'INTEGER',
  'NUMERIC'
]

const order = [
  'ASC',
  'DESC'
]

const string = [
  'BINARY',
  'CHAR',
  'TEXT'
]

const list = [
  ...compare,
  ...order,
  ...date,
  ...number,
  ...string
]

export default list.reduce((object, token) => {
  return {
    ...object,
    [camelCase(token)]: {
      object: SqlSnippet,
      options: {
        name: token,
        postfix: ` ${token}`
      }
    }
  }
}, {})
