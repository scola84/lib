import { Node } from '../node'
const classes = ['right', 'center', 'left']

export class Bar extends Node {
  checkChild (classed, before) {
    const size = this._node
      .select('.' + classed)
      .size()

    if (size > 0) {
      return
    }

    this._node
      .insert('div', '.' + before)
      .classed(classed, true)
  }

  resolveAfter () {
    for (let i = 0; i < classes.length; i += 1) {
      this.checkChild(classes[i], classes[i - 1])
    }

    return this._node
  }
}
