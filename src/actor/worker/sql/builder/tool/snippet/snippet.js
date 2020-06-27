import isFunction from 'lodash/isFunction.js'
import isNil from 'lodash/isNil.js'
import { Snippet } from '../../../../../helper/index.js'

export class SqlSnippet extends Snippet {
  constructor (options = {}) {
    super(options)

    this._client = null
    this._infix = null
    this._parens = null
    this._postfix = null
    this._prefix = null

    this.setClient(options.client)
    this.setInfix(options.infix)
    this.setParens(options.parens)
    this.setPostfix(options.postfix)
    this.setPrefix(options.prefix)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      client: this._client,
      infix: this._infix,
      parens: this._parens,
      postfix: this._postfix,
      prefix: this._prefix
    }
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  client (value) {
    return this.setClient(value)
  }

  getInfix () {
    return this._infix
  }

  setInfix (value = ', ') {
    this._infix = value
    return this
  }

  infix (value) {
    return this.setInfix(value)
  }

  getParens () {
    return this._parens
  }

  setParens (value = false) {
    this._parens = value
    return this
  }

  parens (value = true) {
    return this.setParens(value)
  }

  getPostfix () {
    return this._postfix
  }

  setPostfix (value = '') {
    this._postfix = value
    return this
  }

  postfix (value) {
    return this.setPostfix(value)
  }

  getPrefix () {
    return this._prefix
  }

  setPrefix (value = '') {
    this._prefix = value
    return this
  }

  prefix (value) {
    return this.setPrefix(value)
  }

  concat (left, right) {
    if (left[left.length - 1] === ' ' && right[0] === ' ') {
      return left + right.slice(1)
    }

    return left + right
  }

  merge (box, data, result) {
    return this.mergeInner(box, data, result)
  }

  mergeInner (box, data, result) {
    let merged = result
    let arg = null

    for (let i = 0; i < this._args.length; i += 1) {
      arg = this._args[i]

      if ((arg instanceof SqlSnippet) === true) {
        merged = arg.merge(box, data, merged)
      }
    }

    return merged
  }

  resolve (box, data) {
    let value = ''

    if (this.hasPermission(box, data) === true) {
      value = this.concat(value, this.resolvePrefix(box, data))
      value = this.concat(value, this.resolveInner(box, data))
      value = this.concat(value, this.resolvePostfix(box, data))
    }

    return value
  }

  resolveInfix () {
    return this._infix
  }

  resolveInner (box, data) {
    let arg = null
    let count = 0
    let value = ''

    for (let i = 0; i < this._args.length; i += 1) {
      arg = this.resolveValue(box, data, this._args[i])

      if (arg.length === 0) {
        continue
      }

      if (count > 0) {
        value = this.concat(value, this.resolveInfix(box, data))
      }

      value = this.concat(value, arg)
      count += 1
    }

    return this.resolveParens(value)
  }

  resolveParens (value) {
    if (this._parens === true) {
      return `(${value})`
    }

    return value
  }

  resolvePostfix () {
    return this._postfix
  }

  resolvePrefix () {
    return this._prefix
  }

  resolveValue (box, data, value) {
    if (isNil(value) === true) {
      return 'NULL'
    }

    if ((value instanceof SqlSnippet) === true) {
      return this.resolveValue(box, data, value.resolve(box, data))
    }

    if (isFunction(value) === true) {
      return this.resolveValue(box, data, value(box, data))
    }

    return value
  }
}
