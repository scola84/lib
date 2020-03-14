import * as d3 from 'd3-selection'
import { Node } from '../node.js'

export class Panel extends Node {
  constructor (options = {}) {
    super(options)
    this.class('transition')
  }

  resolveAfter (box) {
    const effect = ['rtl', 'ltr', 'ins']
      .find((name) => box.options[name] === true) || 'none'

    const old = this.isInstance(box.base.snippet, Panel) === true
      ? box.base.snippet.node()
      : d3.select(document.body)

    if (old.node() === this._node.node()) {
      return this._node
    }

    old.style('width')
    this._node.style('width')

    old.classed('in', false)
    this._node.classed('in', true)

    const duration = parseFloat(this._node.style('transition-duration'))

    if (effect === 'none' || duration === 0) {
      old.dispatch('transitionend')
      this._node.dispatch('transitionend')
    }

    box.base.snippet = this

    return this._node
  }

  resolveBefore (box, data) {
    const old = this.isInstance(box.base.snippet, Panel) === true
      ? box.base.snippet.node().classed('rtl ltr ins', false)
      : d3.select()

    if (old.node() === this._node.node()) {
      return this.resolveOuter(box, data)
    }

    const effect = ['rtl', 'ltr', 'ins']
      .find((name) => box.options[name] === true) || 'none'

    const path = box.path.split('-').join(' ')

    old
      .classed('old', true)
      .classed(effect, true)
      .on('transitionend.scola-panel-old', () => {
        old.on('.scola-panel-old', null)
        old.node().snippet.remove()
      })

    this._node
      .classed('new', true)
      .classed(effect, true)
      .classed(path, true)
      .on('transitionend.scola-panel-new', () => {
        this._node.on('.scola-panel-new', null)
      })

    return this.resolveOuter(box, data)
  }
}
