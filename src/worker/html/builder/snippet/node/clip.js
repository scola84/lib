import { select } from 'd3-selection'
import { Node } from '../node'

export class Clip extends Node {
  createNode () {
    const fragment = document.createDocumentFragment()

    fragment.getAttribute = () => {}
    fragment.setAttribute = () => {}
    fragment.snippet = this

    this.setNode(select(fragment))

    this._parent
      .node()
      .insert(() => this._node.node())
  }

  resolveInner (box, data) {
    for (let i = 0; i < this._args.length; i += 1) {
      if (i === box.tab) {
        this.resolveValue(box, data, this._args[i])
      } else {
        this._args[i].remove()
      }
    }

    this._parent
      .node()
      .insert(() => this._node.node())

    return this.resolveAfter(box, data)
  }
}
