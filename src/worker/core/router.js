import { Worker } from './worker'

export class Router extends Worker {
  constructor (options = {}) {
    super(options)

    this._downstreams = null
    this.setDownstreams(options.downstreams)
  }

  getDownstreams () {
    return this._downstreams
  }

  setDownstreams (value = {}) {
    this._downstreams = value
    return this
  }

  act (box, data) {
    const name = this.filter(box, data)

    if (this._downstreams[name] !== undefined) {
      this._downstreams[name].handleAct(box, data)
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

  filter (box, data, context) {
    if (this._filter !== null) {
      return this._filter(box, data, context)
    }

    return box.name
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
}
