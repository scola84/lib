import { Node } from '../node.js'

export class Message extends Node {
  constructor (options = {}) {
    super(options)

    this._default = null
    this._prefix = null

    this.setDefault(options.default)
    this.setPrefix(options.prefix)

    this.class('transition')
  }

  getDefault () {
    return this._default
  }

  setDefault (value = null) {
    this._default = value
    return this
  }

  default (value) {
    return this.setDefault(value)
  }

  getPrefix () {
    return this._prefix
  }

  setPrefix (value = 'message') {
    this._prefix = value
    return this
  }

  prefix (value) {
    return this.setPrefix(value)
  }

  resolveAfter (box, data) {
    const {
      type = this._default
    } = data || {}

    if (type === null) {
      return this._node.classed('in', false)
    }

    const html = this._origin
      .print()
      .html()
      .format(type)
      .prefix(this._prefix)
      .values(data)

    this._node
      .html(this.resolveValue(box, data, html))
      .classed('in', true)

    return this._node
  }
}
