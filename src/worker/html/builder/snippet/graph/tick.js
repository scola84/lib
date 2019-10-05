import { Node } from '../node'

export class Tick extends Node {
  resolveAfter () {
    const text = this._node.text()

    this._node.text(null)

    this._node
      .append('div')
      .classed('text', true)
      .text(text)

    this._node
      .append('div')
      .classed('mark', true)

    return this._node
  }
}
