import { Node } from '../node'

export class Progress extends Node {
  constructor (options = {}) {
    super(options)
    this.class('transition')
  }

  resolveAfter (box, data) {
    if (data.lengthComputable !== true) {
      return this._node
    }

    const fraction = data.loaded / data.total

    this._node
      .style('transition-duration', null)
      .style('width', (fraction * 100) + '%')
      .on('transitionend.scola-progress', () => {
        if (fraction < 1) {
          return
        }

        if (this._node === null) {
          return
        }

        this._node
          .style('transition-duration', '0s')
          .style('width', null)
          .on('.scola-progress', null)
      })

    const duration = parseFloat(
      this._node.style('transition-duration')
    )

    if (duration === 0) {
      this._node.dispatch('transitionend')
    }

    return this._node
  }
}
