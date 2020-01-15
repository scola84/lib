import merge from 'lodash/merge.js'
import { Worker } from './worker.js'

export class Slicer extends Worker {
  constructor (options = {}) {
    super(options)

    this._count = null
    this._resolve = null
    this._slice = null

    this.setCount(options.count)
    this.setResolve(options.resolve)
    this.setSlice(options.slice)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      count: this._count,
      resolve: this._resolve,
      slice: this._slice
    }
  }

  getCount () {
    return this._count
  }

  setCount (value = 1) {
    this._count = value
    return this
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

  act (actBox, data) {
    const box = this._wrap === true
      ? { box: actBox }
      : actBox

    if (Array.isArray(data) === false) {
      throw new Error('400 [slicer] Data is not an array')
    }

    if (this._resolve === true) {
      this.prepareBox(box, data.length)
    }

    if (data.length === 0) {
      if (this._bypass !== null) {
        this._bypass.callAct(box, data)
      }
    } else if (this._downstream !== null) {
      for (let i = 0; i < data.length; i += this._count) {
        this._downstream.callAct(box,
          this.resolve('slice', box, data, [data, i, i + this._count]))
      }
    }
  }

  err (actBox, error) {
    const box = this._wrap === true
      ? { box: actBox }
      : actBox

    if (this._resolve === true) {
      this.prepareBox(box, 0)
    }

    this.fail(box, error)
  }

  slice (box, data, items, begin, end) {
    this.log('info', 'Slicing "%d-%d/%d"', [begin, end, items.length], box.rid)

    let slice = items.slice(begin, end)

    if (slice.length === 0) {
      throw new Error('400 [slicer] Slice is empty')
    }

    if (this._count === 1) {
      slice = Object.defineProperty(slice[0], 'index', {
        configurable: true,
        value: begin
      })
    }

    return slice
  }

  prepareBox (box, length) {
    return merge(box, {
      resolve: {
        [this._name]: {
          count: 0,
          data: [],
          empty: length === 0,
          total: Math.ceil(length / this._count)
        }
      }
    })
  }
}
