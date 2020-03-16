import camelCase from 'lodash/camelCase.js'
import { Snippet } from '../snippet/snippet.js'

const list = [
  'ASC',
  'BIT',
  'BOOLEAN',
  'CHAR',
  'DATE',
  'DECIMAL',
  'DESC',
  'INTEGER',
  'TEXT',
  'TIME',
  'TIMESTAMP',
  'VARCHAR'
]

export default list.reduce((object, token) => {
  return {
    ...object,
    [camelCase(token)]: {
      object: Snippet,
      options: {
        name: token,
        postfix: ` ${token}`
      }
    }
  }
}, {})
