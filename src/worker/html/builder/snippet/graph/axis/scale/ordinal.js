import { Scale } from './scale'

export class Ordinal extends Scale {
  setName (value = 'ordinal') {
    return super.setName(value)
  }

  calculateDistance (value) {
    let distance = this._domain.keys.indexOf(value)

    distance = (distance - this._domain.min + 0.5) *
      this._ppu

    return Math.round(distance) + 0.5
  }

  calculateTicks () {
    const ticks = []

    let distance = null
    let key = null

    for (let i = this._domain.keys.length - 1; i >= 0; i -= 1) {
      key = this._domain.keys[i]
      distance = this.calculateDistance(key)
      ticks.push([key, distance])
    }

    return ticks
  }

  prepareDomainExogenous () {
    this.prepareDomainMax([this._domain.keys.length])
    this.prepareDomainMin([0])
  }
}
