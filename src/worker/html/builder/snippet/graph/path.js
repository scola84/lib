import { Plot } from './plot'

export class Path extends Plot {
  constructor (options = {}) {
    super(options)

    this._fill = null
    this.setFill(options.fill)

    this
      .name('g')
      .class('plot')
  }

  getOptions () {
    return {
      ...super.getOptions(),
      fill: this._fill
    }
  }

  getFill () {
    return this._fill
  }

  setFill (value = false) {
    this._fill = value
    return this
  }

  fill () {
    return this.setFill(true)
  }

  mapIndex (orientation) {
    return {
      x: 0,
      y: 1
    }[orientation]
  }

  preparePath (box, data) {
    const endogenous = this.findScale('endogenous')
    const exogenous = this.findScale('exogenous')

    const fill = []
    const stroke = []

    const minSet = [
      [0, endogenous.getDomain().min]
    ]

    let key = null
    let min = null
    let set = null
    let value = null

    for (let i = 0; i < data.keys.length; i += 1) {
      key = data.keys[i]
      set = data.data[key]

      for (let j = 0; j < set.length; j += 1) {
        fill[j] = fill[j] || ''
        stroke[j] = stroke[j] || ''

        min = this.preparePoint(endogenous, exogenous, minSet, key, 0)
        value = this.preparePoint(endogenous, exogenous, set, key, j)

        if (i === 0) {
          fill[j] += `M ${min}`
          stroke[j] += `M ${value}`
        }

        fill[j] += ` L ${value}`
        stroke[j] += ` L ${value}`

        if (i === data.keys.length - 1) {
          fill[j] += ` L ${min}`
        }
      }
    }

    return [fill, stroke]
  }

  preparePoint (endogenous, exogenous, set, key, j) {
    const [, to] = set[j]

    const endogenousOrientation = endogenous.mapOrientation()
    const endogenousIndex = this.mapIndex(endogenousOrientation)

    const exogenousOrientation = exogenous.mapOrientation()
    const exogenousIndex = this.mapIndex(exogenousOrientation)

    const endogenousDistance = endogenous.calculateDistance(to)
    const exogenousDistance = exogenous.calculateDistance(key)

    const value = []

    value[endogenousIndex] = endogenousDistance
    value[exogenousIndex] = exogenousDistance

    return value.join(' ')
  }

  resolveInner (box, data) {
    const newData = this.prepare(data)
    const [fill, stroke] = this.preparePath(box, newData)
    const [path] = this._args

    for (let i = stroke.length - 1; i >= 0; i -= 1) {
      if (this._fill === true) {
        this.appendChild(box, newData, path)
          .attr('d', fill[i])
          .classed('fill', true)
      }

      this.appendChild(box, newData, path)
        .attr('d', stroke[i])
        .classed('stroke', true)
    }

    return this.resolveAfter(box, newData)
  }
}
