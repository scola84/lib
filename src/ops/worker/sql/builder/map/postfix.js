import camelCase from 'lodash/camelCase.js'
import { SqlSnippet } from '../snippet/snippet.js'

const date = [
  'DATE',
  'TIME',
  'TIMESTAMP'
]

const numeric = [
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
  ...order,
  ...date,
  ...numeric,
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