import { Worker } from './worker'

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
    const route = this.route(box, data)

    if (this._downstreams[route] !== undefined) {
      this._downstreams[route].handleAct(box, data)
    } else if (this._bypass !== null) {
      this._bypass.handleAct(box, data)
    }
  }

  connect (name, worker = null) {
    if (worker === null) {
      return this
    }

    if (Array.isArray(worker) === true) {
      this.connect(name, worker[0])
      return worker[1]
    }

    this._downstreams[name] = worker
    return super.connect(worker)
  }

  find (compare) {
    if (compare(this) === true) {
      return this
    }

    const downstreams = Object.values(this._downstreams)
    let found = null

    for (let i = 0; i < downstreams.length; i += 1) {
      found = downstreams[i].find(compare)

      if (found) {
        return found
      }
    }

    return found
  }

  route (box, data) {
    if (this._router !== null) {
      return this._route(box, data)
    }

    return box.name
  }
}
