import merge from 'lodash-es/merge'
import { Worker } from './worker'

export class Broadcaster extends Worker {
  constructor (options = {}) {
    super(options)

    this._downstreams = null
    this._resolve = null

    this.setDownstreams(options.downstreams)
    this.setResolve(options.resolve)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      resolve: this._resolve
    }
  }

  getDownstreams () {
    return this._downstreams
  }

  setDownstreams (value = []) {
    this._downstreams = value
    return this
  }

  getResolve () {
    return this._resolve
  }

  setResolve (value = true) {
    this._resolve = value
    return this
  }

  act (actBox, data) {
    const box = this._wrap === true
      ? { box: actBox }
      : actBox

    if (this._resolve === true) {
      this.prepare(box)
    }

    for (let i = 0; i < this._downstreams.length; i += 1) {
      this._downstreams[i].handleAct(box, data)
    }
  }

  connect (worker = null) {
    if (worker === null) {
      return this
    }

    if (Array.isArray(worker) === true) {
      this.connect(worker[0])
      return worker[1]
    }

    this._downstreams.push(worker)
    return super.connect(worker)
  }

  find (compare) {
    if (compare(this) === true) {
      return this
    }

    let found = null

    for (let i = 0; i < this._downstreams.length; i += 1) {
      found = this._downstreams[i].find(compare)

      if (found) {
        return found
      }
    }

    return found
  }

  prepare (box) {
    merge(box, {
      resolve: {
        [this._name]: {
          count: 0,
          empty: false,
          total: this._downstreams.length
        }
      }
    })
  }
}
