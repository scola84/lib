import { Node } from '../node'

export class Message extends Node {
  constructor (options = {}) {
    super(options)

    this._default = null
    this._prefix = null
    this._type = null

    this.setDefault(options.default)
    this.setPrefix(options.prefix)
    this.setType(options.type)

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

  setPrefix (value = 'status') {
    this._prefix = value
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

  resolveAfter (box, data) {
    const {
      code = this._default
    } = data || {}

    if (code === null) {
      return this._node.classed('in', false)
    }

    const text = this._builder
      .print()
      .format(code)
      .prefix(this._prefix)
      .values(data)

    let value = this.resolveValue(box, data, text)

    if (this._type === 'html') {
      value = this._builder.format('%m', [value])
    }

    this._node[this._type](value)
    this._node.classed('in', true)

    return this._node
  }
}
