import { Node } from '../node'

export class Hint extends Node {
  constructor (options = {}) {
    super(options)

    this._format = null
    this.setFormat(options.format)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      format: this._format
    })
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
    if (data.data === null || data.data === undefined) {
      return this._node
    }

    const parent = this._node.node().parentNode
    let input = parent.querySelector('input, select, textarea')

    if (input === null || input.snippet === undefined) {
      return this._node
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
      format = this._format
        ? this.resolveValue(box, data, this._format)
        : `input.${value.type}.${value.reason}`

      text = this._builder
        .print()
        .format(format)
        .values(value)
    }

    this._node.text(
      this.resolveValue(box, data, text)
    )

    return this._node
  }

  resolveArray (box, data, input, name, value) {
    const multiple = input
      .node()
      .attr('multiple')

    const all = this._builder
      .getView()
      .query(`input[name="${name}"]`)
      .resolve()

    if (multiple === undefined) {
      const index = all.indexOf(input)
      value = value[index]
    } else {
      value = value.reduce((a, v) => v, {})
    }

    return [name, value]
  }
}
