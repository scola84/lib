import isArray from 'lodash/isArray.js'
import isObject from 'lodash/isObject.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import { Node } from '../node.js'

export class Hint extends Node {
  constructor (options = {}) {
    super(options)

    this._format = null
    this.setFormat(options.format)

    this.class('transition')
  }

  getOptions () {
    return {
      ...super.getOptions(),
      format: this._format
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

  resolveAfter (box, data) {
    if (isObject(data) === false) {
      return this.resolveEmpty()
    }

    if (isPlainObject(data.data) === false) {
      return this.resolveEmpty()
    }

    const parent = this._node.node().parentNode
    let input = parent.querySelector('input, select, textarea')

    if (input === null || (input.snippet instanceof Node) === false) {
      return this.resolveEmpty()
    }

    input = input.snippet

    let name = input.node().attr('name')
    let value = data.data[name]

    if (isArray(value) === true) {
      [name, value] = this.resolveArray(box, data, input, name, value)
    }

    if (isPlainObject(value) === false || isString(value.reason) === false) {
      return this.resolveEmpty()
    }

    const format = this._format === null
      ? `input.${value.type}.${value.reason}`
      : this.resolveValue(box, data, this._format)

    const html = this._origin
      .print()
      .html()
      .format(format)
      .prefix(this._prefix)
      .values(data)

    this._node
      .html(this.resolveValue(box, data, html))
      .classed('in', true)

    return this._node
  }

  resolveArray (box, data, input, name, value) {
    const multiple = input
      .node()
      .attr('multiple')

    const all = this._origin
      .selector(`input[name="${name}"]`)
      .resolve(null)

    const resolvedValue = isString(multiple) === false
      ? value[all.indexOf(input)]
      : value.reduce((a, v) => v, {})

    return [name, resolvedValue]
  }

  resolveEmpty () {
    this._node
      .html(null)
      .classed('in', false)
  }
}
