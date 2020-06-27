import camelCase from 'lodash/camelCase.js'
import { SqlSnippet } from './snippet/snippet.js'

const alias = {
  '=': 'eq',
  '!=': 'notEq',
  '<': 'lt',
  '<=': 'ltEq',
  '<=>': 'safeEq',
  '>': 'gt',
  '>=': 'gtEq',
  '*': 'multiply',
  '+': 'plus',
  '-': 'minus',
  '/': 'divide'
}

const compare = [
  '=',
  '!=',
  '<',
  '<=',
  '<=>',
  '>',
  '>=',
  'BETWEEN',
  'IS',
  'IS NOT',
  'LIKE',
  'NOT LIKE'
]

const control = [
  'AS',
  'UNION'
]

const logic = [
  'AND',
  'OR',
  'XOR'
]

const math = [
  '*',
  '+',
  '-',
  '/',
  'DIV'
]

const list = [
  ...compare,
  ...control,
  ...logic,
  ...math
]

export default list.reduce((object, token) => {
  return {
    ...object,
    [camelCase(alias[token] || token)]: {
      object: SqlSnippet,
      options: {
        infix: ` ${token} `,
        name: alias[token] || token
      }
    }
  }
}, {})
