import get from 'lodash/get.js'
import isArray from 'lodash/isArray.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString'
import merge from 'lodash/merge.js'
import { HtmlBuilder } from '../../../builder.js'
import { Snippet } from '../snippet.js'

const regexpBase = '\\{([^}]+)\\}'
const regexpGlobal = new RegExp(regexpBase, 'g')
const regexpSingle = new RegExp(regexpBase)

let slocale = 'nl_NL'
let strings = {}

export class Print extends Snippet {
  static getLocale () {
    return slocale
  }

  static setLocale (value) {
    slocale = value
    return slocale
  }

  static getNumbers () {
    return HtmlBuilder.formatter.n.definitions
  }

  static setNumbers (value) {
    HtmlBuilder.formatter.n.definitions = value
    return HtmlBuilder.formatter.n.definitions
  }

  static addNumbers (value) {
    merge(HtmlBuilder.formatter.n.definitions, value)
    return HtmlBuilder.formatter.n.definitions
  }

  static getStrings () {
    return strings
  }

  static setStrings (value) {
    strings = value
    return strings
  }

  static addStrings (value) {
    merge(strings, value)
    return strings
  }

  static findString (path, locale = slocale) {
    const string = get(strings, `${locale}.${path}`)
    return isString(string) === true ? string : null
  }

  constructor (options = {}) {
    super(options)

    this._format = null
    this._locale = null
    this._prefix = null
    this._type = null
    this._values = null

    this.setFormat(options.format)
    this.setLocale(options.locale)
    this.setPrefix(options.prefix)
    this.setType(options.type)
    this.setValues(options.values)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      format: this._format,
      locale: this._locale,
      prefix: this._prefix,
      values: this._values
    }
  }

  getFormat () {
    return this._format
  }

  setFormat (value = null) {
    this._format = value
    return this
  }

  format (value) {
    return this.setFormat(value)
  }

  getLocale () {
    return this._locale
  }

  setLocale (value = slocale) {
    this._locale = value
    return this
  }

  locale (value) {
    return this.setLocale(value)
  }

  getPrefix () {
    return this._prefix
  }

  setPrefix (value = []) {
    this._prefix = isArray(value) === true
      ? value
      : [value]

    return this
  }

  prefix (value) {
    return this.setPrefix(value)
  }

  getType () {
    return this._type
  }

  setType (value = 'text') {
    this._type = value
    return this
  }

  type (value) {
    return this.setType(value)
  }

  html () {
    return this.setType('html')
  }

  text () {
    return this.setType('text')
  }

  getValues () {
    return this._values
  }

  setValues (value = (box, data) => data) {
    this._values = value
    return this
  }

  values (value) {
    return this.setValues(value)
  }

  findLocaleString (box, data, locale, format) {
    if (this._prefix.length === 0) {
      return Print.findString(format, locale)
    }

    let prefix = null
    let string = null

    for (let i = 0; i < this._prefix.length; i += 1) {
      prefix = this.resolveValue(box, data, this._prefix[i])
      string = Print.findString(`${prefix}.${format}`, locale)

      if (string !== null) {
        return string
      }
    }

    return null
  }

  resolveAfter (box, data) {
    return this.resolveFormat(box, data, this.resolveValue(box, data, this._format))
  }

  resolveFormat (box, data, format) {
    const locale = this.resolveValue(box, data, this._locale)
    let values = this.resolveValue(box, data, this._values)

    if (isArray(values) === false) {
      values = [values]
    }

    let string = this.findLocaleString(box, data, locale, format)

    if (string === null) {
      string = format
    }

    if (isPlainObject(string) === true) {
      string = string[values[0]] || string.d
    }

    string = this.resolveValue(box, data, string)
    string = this.resolveNested(box, data, string)

    try {
      string = this._origin.format(string, values, locale)
    } catch (error) {
      string = error.message
    }

    if (string === format) {
      return ''
    }

    if (this._type === 'html') {
      string = this._origin.format('%m', [string])
    }

    return string
  }

  resolveNested (box, data, format = '') {
    let resolvedFormat = format
    let match = null

    const matches = resolvedFormat.match(regexpGlobal) || []

    for (let i = 0; i < matches.length; i += 1) {
      [, match] = matches[i].match(regexpSingle)
      resolvedFormat = resolvedFormat.replace(matches[i], this.resolveFormat(box, data, match))
    }

    return resolvedFormat
  }
}
