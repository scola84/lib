import { Plot } from '../../plot.js'

export class Scale {
  constructor (options = {}) {
    this._axis = null
    this._domain = null
    this._max = null
    this._min = null
    this._name = null
    this._position = null
    this._ppu = null
    this._range = null

    this.setAxis(options.axis)
    this.setDomain(options.domain)
    this.setMax(options.max)
    this.setMin(options.min)
    this.setName(options.name)
    this.setPosition(options.type)
    this.setPpu(options.ppu)
    this.setRange(options.range)
  }

  getAxis () {
    return this._axis
  }

  setAxis (value = null) {
    this._axis = value
    return this
  }

  axis (value) {
    return this.setAxis(value)
  }

  getDomain () {
    return this._domain
  }

  setDomain (value = null) {
    this._domain = value
    return this
  }

  domain (value) {
    return this.setDomain(value)
  }

  getMax () {
    return this._max
  }

  setMax (value = 'auto') {
    this._max = value
    return this
  }

  max (value) {
    return this.setMax(value)
  }

  getMin () {
    return this._min
  }

  setMin (value = 'auto') {
    this._min = value
    return this
  }

  min (value) {
    return this.setMin(value)
  }

  getName () {
    return this._name
  }

  setName (value = null) {
    this._name = value
    return this
  }

  name (value) {
    return this.setName(value)
  }

  getPosition () {
    return this._position
  }

  setPosition (value = null) {
    this._position = value
    return this
  }

  position (value) {
    return this.setPosition(value)
  }

  getPpu () {
    return this._ppu
  }

  setPpu (value = null) {
    this._ppu = value
    return this
  }

  ppu (value) {
    return this.setPpu(value)
  }

  getRange () {
    return this._range
  }

  setRange (value = null) {
    this._range = value
    return this
  }

  range (value) {
    return this.setRange(value)
  }

  getType () {
    return this._type
  }

  setType (value = null) {
    this._type = value
    return this
  }

  type (value) {
    return this.setType(value)
  }

  bottom () {
    return this.setPosition('bottom')
  }

  endogenous () {
    return this.setType('endogenous')
  }

  exogenous () {
    return this.setType('exogenous')
  }

  left () {
    return this.setPosition('left')
  }

  right () {
    return this.setPosition('right')
  }

  top () {
    return this.setPosition('top')
  }

  calculateDistance () {}

  calculateTicks () {}

  mapOrientation () {
    return {
      bottom: 'x',
      left: 'y',
      right: 'y',
      top: 'x'
    }[this._position]
  }

  mapPosition () {
    return {
      bottom: 'left',
      left: 'top',
      right: 'top',
      top: 'left'
    }[this._position]
  }

  mapRange () {
    return {
      bottom: 'width',
      left: 'height',
      right: 'height',
      top: 'width'
    }[this._position]
  }

  prepare (data) {
    return this.prepareDomain(data)
  }

  prepareDomain (data) {
    this._domain = {
      keys: [],
      max: -Infinity,
      min: Infinity,
      size: 1,
      type: null
    }

    const plots = this._axis.getBuilder().selector((snippet) => {
      return snippet instanceof Plot &&
        snippet.getData().getPosition().indexOf(this._position) > -1
    }).resolve(null)

    let newData = null

    for (let i = 0; i < plots.length; i += 1) {
      newData = plots[i].prepare(data)

      this._domain.size = newData.size
      this._domain.type = newData.type

      this.prepareDomainKeys(newData)

      if (this._type === 'endogenous') {
        this.prepareDomainEndogenous(newData)
      } else {
        this.prepareDomainExogenous(newData)
      }
    }

    return this.prepareRange()
  }

  prepareDomainEndogenous (data) {
    let key = null
    let set = null

    const values = []

    for (let i = 0; i < data.keys.length; i += 1) {
      key = data.keys[i]
      set = data.data[key]

      for (let j = 0; j < set.length; j += 1) {
        values.push(set[j][1])
      }
    }

    this.prepareDomainMax(values)
    this.prepareDomainMin(values)
  }

  prepareDomainExogenous () {}

  prepareDomainKeys (data) {
    let key = null

    for (let i = 0; i < data.keys.length; i += 1) {
      key = data.keys[i]

      if (this._domain.keys.indexOf(key) === -1) {
        this._domain.keys.push(key)
      }
    }
  }

  prepareDomainMax (values) {
    let max = Math.max(this._domain.max, ...values)
    const modifier = this.resolveValue(max, this._max)

    if (modifier === 'auto') {
      max = max < 0 ? 0 : max
    } else if (modifier !== null) {
      max = modifier
    }

    this._domain.max = max
  }

  prepareDomainMin (values) {
    let min = Math.min(this._domain.min, ...values)
    const modifier = this.resolveValue(min, this._min)

    if (modifier === 'auto') {
      min = min > 0 ? 0 : min
    } else if (modifier !== null) {
      min = modifier
    }

    this._domain.min = min
  }

  preparePpu () {
    const name = this.mapRange()

    this._ppu = this._range[name] /
      (this._domain.max - this._domain.min)

    return this
  }

  prepareRange () {
    const node = this._axis.node().node()
    const style = window.getComputedStyle(node)

    this._range = {
      height: this.prepareRangeFrom(style, ['height', 'padding-top', 'padding-bottom']),
      width: this.prepareRangeFrom(style, ['width', 'padding-left', 'padding-right'])
    }

    return this.preparePpu()
  }

  prepareRangeFrom (style, names) {
    return names.reduce((result, name) => {
      const value = parseFloat(style[name])
      return result === 0 ? value : result - value
    }, 0)
  }

  resolveValue (arg, value) {
    if (typeof value === 'function') {
      return this.resolveValue(arg, value(arg))
    }

    return value
  }
}
