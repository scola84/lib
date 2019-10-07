import merge from 'lodash-es/merge'
import { Worker } from './worker'

export class Slicer extends Worker {
  constructor (options = {}) {
    super(options)

    this._count = null
    this._resolve = null

    this.setCount(options.count)
    this.setResolve(options.resolve)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      count: this._count,
      resolve: this._resolve
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

  act (box, data) {
    const items = this.filter(box, data)
    const newBox = this._wrap === true ? { box } : box

    if (this._resolve === true) {
      merge(newBox, {
        resolve: {
          [this._name]: {
            count: 0,
            empty: items.length === 0,
            total: Math.ceil(items.length / this._count)
          }
        }
      })
    }

    if (items.length === 0) {
      if (this._bypass !== null) {
        this._bypass.handleAct(newBox, data)
      }
    } else if (this._downstream !== null) {
      for (let i = 0; i < items.length; i += this._count) {
        this._downstream.handleAct(
          ...this.merge(newBox, data, items, i, i + this._count)
        )
      }
    }
  }

  err (box, error) {
    const newBox = this._wrap === true ? { box } : box

    if (this._resolve === true) {
      merge(newBox, {
        resolve: {
          [this._name]: {
            empty: true
          }
        }
      })
    }

    this.fail(newBox, error)
  }

  merge (box, data, items, begin, end) {
    if (this._merge !== null) {
      return this._merge(box, data, items, begin, end)
    }

    const slices = items.slice(begin, end)
    const newData = this._count === 1 ? slices[0] : slices

    return [box, newData]
  }
}
