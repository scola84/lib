import isArray from 'lodash/isArray.js'
import isObject from 'lodash/isObject.js'
import { Worker } from './worker.js'

export class Slicer extends Worker {
  constructor (options = {}) {
    super(options)

    this._resolve = null
    this.setResolve(options.resolve)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      resolve: this._resolve
    }
  }

  getResolve () {
    return this._resolve
  }

  setResolve (value = true) {
    this._resolve = value
    return this
  }

  act (box, data) {
    if (this._resolve === true) {
      this.prepareBoxResolve(box, data.length)
    }

    for (let i = 0; i < data.length; i += 1) {
      this.log('info', 'Slicing %d/%d', [i + 1, data.length], box.rid)
      this.pass(box, data[i], i)
    }
  }

  decide (box, data, context) {
    if (context === 'err') {
      return false
    }

    return isArray(data) && data.length > 0
  }

  err (box, error) {
    if (this._resolve === true) {
      this.prepareBoxResolve(box, 0)
    }

    this.fail(box, error)
  }

  merge (box, data, index) {
    return Object.defineProperty(data, 'index', {
      configurable: true,
      value: index
    })
  }

  prepareBoxResolve (box, total) {
    if (isObject(box[`resolve.${this._name}`]) === true) {
      throw new Error(`Resolve for '${this._name}' is defined`)
    }

    box[`resolve.${this._name}`] = {
      total,
      count: 0,
      data: []
    }

    return box
  }
}
