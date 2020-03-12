import camelCase from 'lodash/camelCase.js'
import { Snippet } from '../snippet/snippet.js'

const alias = {
  '!=': 'notEq',
  '&': 'bitAnd',
  '*': 'multiply',
  '+': 'plus',
  '-': 'minus',
  '/': 'divide',
  '<': 'lt',
  '<<': 'bitLeft',
  '<=': 'ltEq',
  '<=>': 'safeEq',
  '=': 'eq',
  '>': 'gt',
  '>=': 'gtEq',
  '>>': 'bitRight',
  '^': 'bitXor',
  '|': 'bitOr',
  '~': 'bitInv'
}

const list = [
  '!=',
  '&',
  '*',
  '+',
  '-',
  '/',
  '<',
  '<<',
  '<=',
  '<=>',
  '=',
  '>',
  '>=',
  '>>',
  '^',
  '|',
  '~',
  'AND',
  'AS',
  'BETWEEN',
  'DIV',
  'IN',
  'IS',
  'LIKE',
  'NOT',
  'OR',
  'REGEXP',
  'RLIKE',
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
