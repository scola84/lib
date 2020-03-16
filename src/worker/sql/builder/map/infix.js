import camelCase from 'lodash/camelCase.js'
import { Snippet } from '../snippet/snippet.js'

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

const list = [
  '!=',
  '*',
  '+',
  '-',
  '/',
  '<',
  '<=',
  '<=>',
  '=',
  '>',
  '>=',
  'AND',
  'AS',
  'BETWEEN',
  'IN',
  'IS',
  'LIKE',
  'NOT',
  'OR',
  'UNION',
  'XOR'
]

export default list.reduce((object, token) => {
  return {
    ...object,
    [camelCase(alias[token] || token)]: {
      object: Snippet,
      options: {
        infix: ` ${token} `,
        name: alias[token] || token
      }
    }
  }
}, {})
