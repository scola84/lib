import d3 from 'd3-format/dist/d3-format.js'
import fs from 'fs-extra'
import isFunction from 'lodash/isFunction.js'
import isNil from 'lodash/isNil.js'
import isObject from 'lodash/isObject.js'
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

    this._locales = null
    this.setLocales(options.locales)
  }

  getLocales () {
    return this._locales
  }

  setLocales (value = 'en_US') {
    if (isObject(value) === true) {
      return this.setLocalesFromObject(value)
    }

    return this.setLocalesFromString(value)
  }

  setLocalesFromObject (value) {
    this._locales = Object
      .keys(value)
      .reduce((result, locale) => {
        return {
          ...result,
          [locale]: d3.formatLocale(value[locale])
        }
      }, {})

    return this
  }

  setLocalesFromString (value) {
    this._locales = value
      .split(',')
      .reduce((result, locale) => {
        return {
          ...result,
          [locale]: d3.formatLocale(JSON.parse(fs.readFileSync([
            process.cwd(),
            '/node_modules/@scola/lib',
            '/node_modules/d3-format/locale/',
            locale.split('_').join('-'),
            '.json'
          ].join(''))))
        }
      }, {})
  }

  format (value, options, locale) {
    const {
      def = '',
      expr = 'n',
      val = '',
      sep = '',
      spec = '.0f'
    } = options

    if (isNil(value) === true) {
      return def
    }

    if (isObject(this._locales[locale]) === false) {
      throw new Error(`Number locale for '${locale}' is not an object`)
    }

    const formatter = val === ''
      ? this._locales[locale].format(spec)
      : this._locales[locale].formatPrefix(spec, val)

    let result = expr.replace('n', value)

    result = math.eval(result)
    result = formatter(result)

    result = sep === ''
      ? result
      : result.slice(0, -1) + sep + result.slice(-1)

    return result
  }
}
