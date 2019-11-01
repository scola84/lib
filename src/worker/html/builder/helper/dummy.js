export class Dummy {
  constructor () {
    this._attributes = {}
    this._properties = {}
  }

  attr (key, value) {
    if (value === undefined) {
      return this._attributes[key] === undefined
        ? null
        : this._attributes[key]
    }

    this._attributes[key] = value
    return this
  }

  classed () {
    return this
  }

  html () {
    return this
  }

  property (key, value) {
    if (value === undefined) {
      if (key === 'value') {
        return this.attr(key)
      }

      return this._properties[key] === undefined
        ? null
        : this._properties[key]
    }

    this._properties[key] = value
    return this
  }

  style () {
    return this
  }

  text () {
    return this
  }
}
