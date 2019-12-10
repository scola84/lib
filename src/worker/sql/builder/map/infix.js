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
  '~': 'bitInv',
  '->': 'jsonExtract'
}

const unspaced = [
  '->'
]

const spaced = [
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
  '->',
  'AND',
  'AS',
  'BETWEEN',
  'DIV',
  'IN',
  'IS',
  'LIKE',
  'MATCH AGAINST',
  'NOT',
  'OR',
  'OVER',
  'REGEXP',
  'RLIKE',
  'SOUNDS LIKE',
  'UNION',
  'XOR'
]

export default [
  ...spaced.map((token) => {
    return {
      name: alias[token] || token,
      token: ` ${token} `
    }
  }),
  ...unspaced.map((token) => {
    return {
      name: alias[token] || token,
      token
    }
  })
]
