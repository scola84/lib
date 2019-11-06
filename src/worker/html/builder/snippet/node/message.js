import { Node } from '../node'

export class Message extends Node {
  constructor (options = {}) {
    super(options)

    this._markdown = null
    this._prefix = null

    this.setMarkdown(options.markdown)
    this.setPrefix(options.prefix)

    this.class('transition')
  }

  getMarkdown () {
    return this._markdown
  }

  setMarkdown (value = true) {
    this._markdown = value
    return this
  }

  markdown (value) {
    return this.setMarkdown(value)
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

    const value = this.resolveValue(box, data, text)

    if (this._markdown === true) {
      this._node.html(this._builder.format('%m', [value]))
    } else {
      this._node.text(value)
    }

    this._node.classed('in', true)

    return this._node
  }
}
