import * as d3 from 'd3-selection'
import { Axis } from './axis.js'
import { Parent } from '../parent.js'
import { map } from './plot/index.js'

export class Plot extends Parent {
  constructor (options = {}) {
    super(options)

    this._data = null
    this._tip = null

    this.setData(options.data)
    this.setTip(options.tip)

    this.class('transition')
  }

  getOptions () {
    return {
      ...super.getOptions(),
      data: this._data,
      tip: this._tip
    }
  }

  getData () {
    return this._data
  }

  setData (value = null) {
    this._data = value
    return this
  }

  data (value) {
    return this.setData(value(this))
  }

  getTip () {
    return this._tip
  }

  setTip (value = null) {
    this._tip = value
    return this
  }

  tip (value) {
    return this.setTip(value)
  }

  appendTip (box, data, node) {
    if (this._tip === null) {
      return
    }

    node
      .on('mouseover.scola-plot', () => {
        data.target = d3.event.target
        this.resolveValue(box, data, this._tip.setParent(null))
      })
      .on('mouseout.scola-plot', () => {
        this._tip.remove()
      })
  }

  findScale (type) {
    const position = this._data.getPosition()

    const [axis] = this._origin
      .selector((snippet) => {
        if (this.isInstance(snippet, Axis) === false) {
          return false
        }

        const scale = snippet.getScale()

        return position.indexOf(scale.getPosition()) > -1 &&
          scale.getType() === type
      })
      .resolve(null)

    return axis.getScale()
  }

  prepare (data) {
    return this._data.prepare(data)
  }

  removeChildren () {
    const children = Array.from(this._node.node().childNodes)

    for (let i = 0; i < children.length; i += 1) {
      this.removeTip(d3.select(children[i]))
    }

    super.removeChildren()
  }

  removeTip (node) {
    node.on('.scola-plot', null)
  }

  removeInner () {
    this.removeChildren()
    this.removeAfter()
  }

  resolveBefore (box, data) {
    this.removeChildren()
    return this.resolveOuter(box, data)
  }
}

Plot.attachFactories({ map })
