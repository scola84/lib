import d3 from 'd3-format/dist/d3-format.js'
import isFunction from 'lodash/isFunction.js'
import isNil from 'lodash/isNil.js'
import math from 'math-expression-evaluator'
import { Formatter } from './formatter.js'

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

export class NumberFormatter extends Formatter {
  constructor (options = {}) {
    super(options)

    this._definitions = null
    this.setDefinitions(options.definitions)
  }

  getDefinitions () {
    return this._definitions
  }

  setDefinitions (value = {}) {
    this._definitions = Object
      .keys(value)
      .reduce((result, locale) => {
        return {
          ...result,
          [locale]: d3.formatLocale(value[locale])
        }
      }, {
        nl_NL: d3.formatLocale({
          decimal: ',',
          thousands: '.',
          grouping: [3],
          currency: ['€\u00a0', '']
        })
      })

    return this
  }

  format (value, options, locale) {
    if (isNil(value) === true) {
      return ''
    }

    const {
      expr = 'n',
      val = '',
      sep = '',
      spec = '.0f'
    } = options

    const formatter = val === ''
      ? this._definitions[locale].format(spec)
      : this._definitions[locale].formatPrefix(spec, val)

    let result = expr.replace('n', value)

    result = math.eval(result)
    result = formatter(result)

    result = sep === ''
      ? result
      : result.slice(0, -1) + sep + result.slice(-1)

    return result
  }
}
