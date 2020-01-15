import * as d3 from 'd3-selection'
import { Node } from '../node.js'

export class Tip extends Node {
  constructor (options = {}) {
    super(options)
    this.class('transition')
  }

  removeOuter () {
    this._node
      .classed('out', true)
      .on('transitionend.scola-tip', () => {
        this._node.on('.scola-tip', null)
        this.removeNode()
        this.removeInner()
      })

    const duration = parseFloat(this._node.style('transition-duration'))

    if (duration === 0) {
      this._node.dispatch('transitionend')
    }
  }

  resolveAfter (box, data) {
    d3.select('body').insert(() => this._node.node())

    const targetRect = data.target.getBoundingClientRect()
    const tipRect = this._node.node().getBoundingClientRect()

    const left = targetRect.left +
      (targetRect.width / 2) -
      (tipRect.width / 2)

    const top = targetRect.top -
      tipRect.height

    this._node
      .style('top', `${top}px`)
      .style('left', `${left}px`)
      .style('width', `${tipRect.width}px`)
      .style('height', `${tipRect.height}px`)

    this._node.classed('in', true)
  }

  resolveBefore (box, data) {
    if (this._node.classed('out') === true) {
      this.removeNode()
      this.createNode()
    }

    return this.resolveOuter(box, data)
  }
}
