import { Dummy } from '../../helper'
import { Node } from '../node'

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
