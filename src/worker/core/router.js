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
    if (this._act) {
      this._act(box, data)
      return
    }

    const name = this.filter(box, data)
    this.pass(name, box, data)
  }

  connect (name, worker = null) {
    if (worker === null) {
      return this
    }

    if (Array.isArray(worker)) {
      this.connect(name, worker[0])
      return worker[1]
    }

    this._downstreams[name] = worker
    return super.connect(worker)
  }

  filter (box, data, context) {
    if (this._filter) {
      return this._filter(box, data, context)
    }

    return box.name
  }

  find (compare, up = false) {
    let found = super.find(compare, up)

    if (found !== null) {
      return found
    }

    const names = Object.keys(this._downstreams)

    for (let i = 0; i < names.length; i += 1) {
      found = this._downstreams[names[i]].find(compare, up)

      if (found) {
        return found
      }
    }

    return found
  }

  pass (name, box, data) {
    if (this._downstreams[name]) {
      this._downstreams[name].handle(box, data)
    } else if (this._bypass) {
      this._bypass.handle(box, data)
    }
  }
}
