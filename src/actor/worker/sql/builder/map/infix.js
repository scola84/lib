import camelCase from 'lodash/camelCase.js'
import { SqlSnippet } from '../snippet/snippet.js'

const alias = {
  '!=': 'notEq',
  '*': 'multiply',
  '+': 'plus',
  '-': 'minus',
  '/': 'divide',
  '<': 'lt',
  '<=': 'ltEq',
  '<=>': 'safeEq',
  '=': 'eq',
  '>': 'gt',
  '>=': 'gtEq'
}

const control = [
  'AS',
  'UNION'
]

const comparison = [
  '!=',
  '<',
  '<=',
  '<=>',
  '=',
  '>',
  '>=',
  'BETWEEN',
  'IS',
  'LIKE'
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
  ...control,
  ...comparison,
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
