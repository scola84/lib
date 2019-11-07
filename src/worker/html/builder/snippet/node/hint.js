import { Node } from '../node'

export class Hint extends Node {
  constructor (options = {}) {
    super(options)

    this._format = null
    this.setFormat(options.format)
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
    if (data === undefined) {
      return this._node.text(null)
    }

    if (data.data === null || data.data === undefined) {
      return this._node.text(null)
    }

    const parent = this._node.node().parentNode
    let input = parent.querySelector('input, select, textarea')

    if (input === null || input.snippet === undefined) {
      return this._node.text(null)
    }

    input = input.snippet

    let name = input.node().attr('name')
    let value = data.data[name]

    if (Array.isArray(value) === true) {
      [name, value] = this.resolveArray(box, data, input, name, value)
    }

    let format = null
    let text = null

    if (value !== undefined && value.reason !== undefined) {
      format = this._format === null
        ? `input.${value.type}.${value.reason}`
        : this.resolveValue(box, data, this._format)

      text = this._builder
        .print()
        .format(format)
        .values(value)
    }

    this._node.text(this.resolveValue(box, data, text))

    return this._node
  }

  resolveArray (box, data, input, name, value) {
    const multiple = input
      .node()
      .attr('multiple')

    const all = this._builder
      .selector(`input[name="${name}"]`)
      .resolve(null)

    const resolvedValue = multiple === undefined
      ? value[all.indexOf(input)]
      : value.reduce((a, v) => v, {})

    return [name, resolvedValue]
  }
}
