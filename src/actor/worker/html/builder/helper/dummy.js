import isUndefined from 'lodash/isUndefined.js'

export class Dummy {
  constructor () {
    this._attributes = {}
    this._properties = {}
  }

  attr (key, value = null) {
    if (value === null) {
      return isUndefined(this._attributes[key]) === true
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

  property (key, value = null) {
    if (value === null) {
      if (key === 'value') {
        return this.attr(key)
      }

      return isUndefined(this._properties[key]) === true
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
