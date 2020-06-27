import { Dummy } from '../../../helper/index.js'
import { Node } from '../node.js'

export class Fragment extends Node {
  node () {
    return this._parent.node()
  }

  createNode () {
    this.setNode(new Dummy())
  }

  removeNode () {
    if (this._node === null) {
      return
    }

    this._node = null
  }
}
