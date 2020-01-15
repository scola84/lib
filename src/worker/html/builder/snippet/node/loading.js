import { Node } from '../node.js'

export class Loading extends Node {
  resolveAfter (box, data) {
    if (data.lengthComputable !== true) {
      return this._node
    }

    const fraction = data.loaded / data.total

    this._node.classed('in', fraction < 1)

    return this._node
  }
}
