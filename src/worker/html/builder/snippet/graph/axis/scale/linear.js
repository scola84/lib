import { Scale } from './scale.js'

export class Linear extends Scale {
  constructor (options = {}) {
    super(options)

    this._count = null
    this._step = null

    this.setCount(options.count)
    this.setStep(options.step)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      count: this._count,
      step: this._step
    }
  }

  getCount () {
    return this._count
  }

  setCount (value = null) {
    this._count = value
    return this
  }

  count (value) {
    return this.setCount(value)
  }

  setName (value = 'linear') {
    return super.setName(value)
  }

  getStep () {
    return this._step
  }

  setStep (value = 1) {
    this._step = value
    return this
  }

  step (value) {
    return this.setStep(value)
  }

  calculateDistance (value) {
    let distance = (value - this._domain.min) * this._ppu

    if (this.mapOrientation() === 'y') {
      distance = this._range.height - distance
    }

    return Math.round(distance) + 0.5
  }

  calculateTicks () {
    const count = this.resolveValue(this._domain, this._count)
    let step = this.resolveValue(this._domain, this._step)

    step = count === null
      ? step
      : this._domain.max / (count - 1)

    const { max, min } = this._domain
    const ticks = []

    let distance = null

    for (let value = max; value >= min; value -= step) {
      distance = this.calculateDistance(value)
      ticks.push([value, distance])
    }

    return ticks
  }

  prepareDomainExogenous () {
    this.prepareDomainMax(this._domain.keys)
    this.prepareDomainMin(this._domain.keys)
  }
}
