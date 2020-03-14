import isArray from 'lodash/isArray.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import { Worker } from './worker.js'

export class Router extends Worker {
  constructor (options = {}) {
    super(options)

    this._downstreams = null
    this._route = null

    this.setDownstreams(options.downstreams)
    this.setRoute(options.route)
  }

  getDownstreams () {
    return this._downstreams
  }

  setDownstreams (value = {}) {
    this._downstreams = value
    return this
  }

  getRoute () {
    return this._route
  }

  setRoute (value = null) {
    this._route = value
    return this
  }

  act (box, data) {
    const route = this.resolve('route', box, data)

    this.log('info', 'Routing to %o', [route], box.rid)

    if (this.isInstance(this._downstreams[route]) === true) {
      this._downstreams[route].callAct(box, data)
    } else if (this._bypass !== null) {
      this._bypass.callAct(box, data)
    } else {
      throw new Error(`404 [router] Route '${route}' is not found`)
    }
  }

  connect (name, worker = null) {
    if (worker === null) {
      return this
    }

    if (isArray(worker) === true) {
      this.connect(name, worker[0])
      return worker[1]
    }

    this._downstreams[name] = worker
    return super.connect(worker)
  }

  route (box, data) {
    if (isPlainObject(data) === true) {
      if (isString(data.name) === true) {
        return data.name
      }
    }

    return box.name
  }
}
