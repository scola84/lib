import camelCase from 'lodash/camelCase.js'
import { Snippet } from '../snippet/snippet.js'

const list = [
  'ASC',
  'BINARY',
  'CHAR',
  'DATE',
  'DATETIME',
  'DECIMAL',
  'DESC',
  'JSON',
  'NCHAR',
  'RANGE',
  'SIGNED',
  'TIME',
  'UNSIGNED'
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
