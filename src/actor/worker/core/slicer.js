import isArray from 'lodash/isArray.js'
import isObject from 'lodash/isObject.js'
import { Worker } from './worker.js'

export class Slicer extends Worker {
  constructor (options = {}) {
    super(options)

    this._resolve = null
    this._slice = null

    this.setResolve(options.resolve)
    this.setSlice(options.slice)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      resolve: this._resolve,
      slice: this._slice
    }
  }

  getResolve () {
    return this._resolve
  }

  setResolve (value = true) {
    this._resolve = value
    return this
  }

  getSlice () {
    return this._slice
  }

  setSlice (value = null) {
    this._slice = value
    return this
  }

  act (box, data) {
    const slices = this.resolve('slice', box, data)

    if (isArray(slices) === false || slices.length === 0) {
      this.callBypass(box, data)
      return
    }

    if (this.setUpBoxResolve(box, data, slices.length) === false) {
      this.fail(box, data, new Error(`Could not set up resolve for '${this._name}'`))
      return
    }

    for (let i = 0; i < slices.length; i += 1) {
      this.log('info', 'Slicing %d/%d', [i + 1, slices.length], box.rid)
      this.pass(box, slices[i], i)
    }
  }

  merge (box, data, index) {
    data.index = index
    return data
  }

  setUpBoxResolve (box, data, total) {
    if (this._resolve === false) {
      return true
    }

    if (isObject(box[`resolve.${this._name}`]) === true) {
      return false
    }

    box[`resolve.${this._name}`] = {
      data,
      total,
      collect: [],
      count: 0
    }

    return true
  }

  slice (box, data) {
    return isArray(data) ? data : []
  }
}
