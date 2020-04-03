import { Plot } from './plot.js'

export class Rect extends Plot {
  constructor (options = {}) {
    super(options)

    this._padding = null
    this.setPadding(options.padding)

    this
      .name('g')
      .class('plot')
  }

  getOptions () {
    return {
      ...super.getOptions(),
      padding: this._padding
    }
  }

  getPadding () {
    return this._padding
  }

  setPadding (value = 0.1) {
    this._padding = value
    return this
  }

  padding (value) {
    return this.setPadding(value)
  }

  appendRect (box, key, j, set, endogenous, exogenous) {
    const [rect] = this._args
    const [from, to, datum] = set[j] || [0, 0, {}]

    const data = {
      datum,
      from,
      key,
      to
    }

    const padding = this.resolveValue(box, data, this._padding)

    const endogenousRange = endogenous.mapRange()
    const endogenousOrientation = endogenous.mapOrientation()

    const begin = endogenous.calculateDistance(from)
    let end = endogenous.calculateDistance(to)

    if (begin === end) {
      end = endogenous.calculateDistance(3 / endogenous.getPpu())
    }

    let endogenousDistance = end
    let endogenousSize = begin - end

    if (begin < end) {
      endogenousDistance = begin
      endogenousSize = end - begin
    }

    const exogenousRange = exogenous.mapRange()
    const exogenousOrientation = exogenous.mapOrientation()

    let exogenousDistance = exogenous.calculateDistance(key)
    let exogenousSize = exogenous.getPpu()

    if (exogenous.getDomain().type === 'group') {
      exogenousSize /= exogenous.getDomain().size
      exogenousDistance += j * exogenousSize
      exogenousDistance -= exogenousSize
    }

    exogenousDistance -= exogenousSize * 0.5
    exogenousDistance += exogenousSize * padding
    exogenousSize -= exogenousSize * padding * 2

    const node = this.appendChild(box, data, rect)
      .attr(endogenousOrientation, endogenousDistance)
      .attr(endogenousRange, endogenousSize)
      .attr(exogenousOrientation, exogenousDistance)
      .attr(exogenousRange, exogenousSize)
      .classed('negative', to < 0)
      .classed('zero', to === 0)

    this.appendTip(box, data, node)
  }

  resolveInner (box, data) {
    const endogenous = this.findScale('endogenous')
    const exogenous = this.findScale('exogenous')

    let key = null
    let set = null

    const newData = this.prepare(data)

    for (let i = 0; i < newData.keys.length; i += 1) {
      key = newData.keys[i]
      set = newData.data[key]

      for (let j = 0; j < set.length; j += 1) {
        this.appendRect(box, key, j, set, endogenous, exogenous)
      }
    }

    return this.resolveAfter(box, newData)
  }
}
