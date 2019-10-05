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
    return Object.assign(super.getOptions(), {
      count: this._count,
      resolve: this._resolve
    })
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

    if (this._wrap === true) {
      box = { box }
    }

    if (this._resolve === true) {
      merge(box, {
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
      if (this._bypass) {
        this._bypass.handle(box, data)
      }
    }

    for (let i = 0; i < items.length; i += this._count) {
      this.pass(
        ...this.merge(box, data, items, i, i + this._count)
      )
    }
  }

  merge (box, data, items, begin, end) {
    if (this._merge) {
      return this._merge(box, data, items, begin, end)
    }

    data = items.slice(begin, end)
    data = this._count === 1 ? data[0] : data

    return [box, data]
  }
}
