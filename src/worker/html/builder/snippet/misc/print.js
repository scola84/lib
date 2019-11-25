import merge from 'lodash-es/merge'
import { HtmlBuilder } from '../../../builder'
import { Snippet } from '../snippet'

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
  }

  static getNumbers () {
    return HtmlBuilder.formatter.n.definitions
  }

  static setNumbers (value) {
    HtmlBuilder.formatter.n.definitions = value
  }

  static addNumbers (value) {
    merge(HtmlBuilder.formatter.n.definitions, value)
  }

  static getStrings () {
    return strings
  }

  static setStrings (value) {
    strings = value
  }

  static addStrings (value) {
    merge(strings, value)
  }

  static findString (path, locale = slocale) {
    return `${locale}.${path}`.split('.').reduce((v, k) => {
      return v === undefined ? v : v[k]
    }, strings)
  }

  constructor (options = {}) {
    super(options)

    this._format = null
    this._locale = null
    this._prefix = null
    this._values = null

    this.setFormat(options.format)
    this.setLocale(options.locale)
    this.setPrefix(options.prefix)
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
    this._prefix = Array.isArray(value) === true
      ? value
      : [value]

    return this
  }

  prefix (value) {
    return this.setPrefix(value)
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

      if (string !== undefined) {
        return string
      }
    }

    return undefined
  }

  resolveAfter (box, data) {
    return this.resolveFormat(
      box,
      data,
      this.resolveValue(box, data, this._format)
    )
  }

  resolveFormat (box, data, format) {
    const locale = this.resolveValue(box, data, this._locale)
    let values = this.resolveValue(box, data, this._values)

    if (Array.isArray(values) === false) {
      values = [values]
    }

    let string = this.findLocaleString(box, data, locale, format)

    if (string === undefined) {
      string = format
    }

    if (typeof string === 'object') {
      string = string[values[0]] || string.d
    }

    string = this.resolveValue(box, data, string)
    string = this.resolveNested(box, data, string)

    try {
      string = this._builder.format(string, values, locale)
    } catch (error) {
      string = error.message
    }

    if (string === format) {
      return ''
    }

    return string
  }

  resolveNested (box, data, format = '') {
    let resolvedFormat = format
    let match = null

    const matches = resolvedFormat.match(regexpGlobal) || []

    for (let i = 0; i < matches.length; i += 1) {
      [, match] = matches[i].match(regexpSingle)

      resolvedFormat = resolvedFormat.replace(
        matches[i],
        this.resolveFormat(box, data, match)
      )
    }

    return resolvedFormat
  }
}
