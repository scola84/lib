import isUndefined from 'lodash/isUndefined.js'
import { Data } from './data.js'

export class Group extends Data {
  constructor (options = {}) {
    super(options)

    this._index = null
    this.setIndex(options.value)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      index: this._index
    }
  }

  getIndex () {
    return this._index
  }

  setIndex (value = null) {
    this._index = value
    return this
  }

  index (value) {
    return this.setIndex(value)
  }

  prepareValue (result, datum) {
    const exogenous = this._exogenous(datum)
    const endogenous = this._endogenous(datum)

    if (isUndefined(result.data[exogenous]) === true) {
      result.data[exogenous] = []
      result.keys.push(exogenous)
      result.type = 'group'
    }

    const set = result.data[exogenous]

    const index = this._index
      ? this._index(datum)
      : set.length

    set[index] = [
      0,
      endogenous,
      datum
    ]

    result.size = set.length
  }
}
