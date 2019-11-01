import merge from 'lodash-es/merge'
import { Worker } from './worker'

export class Slicer extends Worker {
  constructor (options = {}) {
    super(options)

    this._collect = null
    this._count = null
    this._resolve = null
    this._slice = null

    this.setCollect(options.collect)
    this.setCount(options.count)
    this.setResolve(options.resolve)
    this.setSlice(options.slice)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      collect: this._collect,
      count: this._count,
      resolve: this._resolve,
      slice: this._slice
    }
  }

  getCollect () {
    return this._collect
  }

  setCollect (value = null) {
    this._collect = value
    return this
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

    const items = this.collect(actBox, data)

    if (this._resolve === true) {
      this.prepare(box, items.length)
    }

    if (items.length === 0) {
      if (this._bypass !== null) {
        this._bypass.handleAct(box, data)
      }
    } else if (this._downstream !== null) {
      for (let i = 0; i < items.length; i += this._count) {
        this._downstream.handleAct(box,
          this.slice(box, data, items, i, i + this._count))
      }
    }
  }

  collect (box, data) {
    if (this._collect !== null) {
      return this._collect(box, data)
    }

    return data
  }

  err (actBox, error) {
    const box = this._wrap === true
      ? { box: actBox }
      : actBox

    if (this._resolve === true) {
      this.prepare(box, 0)
    }

    this.fail(box, error)
  }

  slice (box, data, items, begin, end) {
    if (this._slice !== null) {
      return this._slice(box, data, items, begin, end)
    }

    const slices = items.slice(begin, end)

    return this._count === 1
      ? slices[0]
      : slices
  }

  prepare (box, length) {
    merge(box, {
      resolve: {
        [this._name]: {
          count: 0,
          empty: length === 0,
          total: Math.ceil(length / this._count)
        }
      }
    })
  }
}
