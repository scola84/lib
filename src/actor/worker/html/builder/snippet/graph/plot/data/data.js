export class Data {
  constructor (options = {}) {
    this._filter = null
    this._endogenous = null
    this._exogenous = null
    this._position = null

    this.setFilter(options.filter)
    this.setEndogenous(options.endogenous)
    this.setExogenous(options.exogenous)
    this.setPosition(options.position)
  }

  getFilter () {
    return this._filter
  }

  setFilter (value = () => true) {
    this._filter = value
    return this
  }

  filter (value) {
    return this.setFilter(value)
  }

  getEndogenous () {
    return this._endogenous
  }

  setEndogenous (value = null) {
    this._endogenous = value
    return this
  }

  endogenous (value) {
    return this.setEndogenous(value)
  }

  getExogenous () {
    return this._exogenous
  }

  setExogenous (value = null) {
    this._exogenous = value
    return this
  }

  exogenous (value) {
    return this.setExogenous(value)
  }

  getPosition () {
    return this._position
  }

  setPosition (value = []) {
    this._position = value
    return this
  }

  addPosition (value) {
    this._position.push(value)
    return this
  }

  position (value) {
    return this.setPosition(value)
  }

  bottom () {
    return this.addPosition('bottom')
  }

  left () {
    return this.addPosition('left')
  }

  right () {
    return this.addPosition('right')
  }

  top () {
    return this.addPosition('top')
  }

  prepare (data) {
    const result = {
      data: {},
      keys: [],
      type: null
    }

    const newData = data.filter(this._filter)

    for (let i = 0; i < newData.length; i += 1) {
      this.prepareValue(result, newData[i])
    }

    return result
  }

  prepareValue () {}
}
