import d3 from 'd3-format/dist/d3-format.js'
import isFunction from 'lodash/isFunction.js'
import isNil from 'lodash/isNil.js'
import math from 'math-expression-evaluator'

const definitions = {
  nl_NL: d3.formatLocale({
    decimal: ',',
    thousands: '.',
    grouping: [3],
    currency: ['€\u00a0', '']
  })
}

math.addToken(
  Object
    .getOwnPropertyNames(Math)
    .filter((name) => {
      return isFunction(Math[name]) === true && Math[name].length > 0
    }).map((name) => {
      return {
        type: [0, 8, 12][Math[name].length - 1],
        token: name,
        show: name,
        value: (...args) => Math[name](...args)
      }
    })
)

export function number (value, options, locale) {
  if (isNil(value) === true) {
    return ''
  }

  const {
    expr = 'n',
    val = '',
    sep = '',
    spec = 'f'
  } = options

  const formatter = val === ''
    ? definitions[locale].format(spec)
    : definitions[locale].formatPrefix(spec, val)

  let result = expr.replace('n', value)

  result = math.eval(result)
  result = formatter(result)

  result = sep === ''
    ? result
    : result.slice(0, -1) + sep + result.slice(-1)

  return result
}

number.definitions = definitions
