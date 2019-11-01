import { Node } from '../node'

export class Message extends Node {
  constructor (options = {}) {
    super(options)

    this._prefix = null
    this.setPrefix(options.prefix)

    this.class('transition')
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

  resolveAfter (box, data) {
    if (data.status === undefined) {
      return this._node.classed('in', false)
    }

    const text = this._builder
      .print()
      .format(String(data.status))
      .prefix(this._prefix)
      .values(data)

    this._node.text(this.resolveValue(box, data, text))
    this._node.classed('in', true)

    return this._node
  }
}
