import isArray from 'lodash/isArray.js'
import isObject from 'lodash/isObject.js'
import { Worker } from './worker.js'

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

  act (box, data) {
    if (this._resolve === true) {
      this.prepareBoxResolve(box)
    }

    for (let i = 0; i < this._downstreams.length; i += 1) {
      this._downstreams[i].callAct(box, data)
    }
  }

  decide () {
    return true
  }

  err (box, error) {
    this.act(box, error)
  }

  connect (worker = null) {
    if (worker === null) {
      return this
    }

    if (isArray(worker) === true) {
      this.connect(worker[0])
      return worker[1]
    }

    this._downstreams.push(worker)
    return super.connect(worker)
  }

  prepareBoxResolve (box) {
    if (isObject(box[`resolve.${this._name}`]) === true) {
      throw new Error(`Resolve for '${this._name}' is defined`)
    }

    box[`resolve.${this._name}`] = {
      count: 0,
      data: [],
      total: this._downstreams.length
    }

    return box
  }
}