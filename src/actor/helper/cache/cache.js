import executeMap from 'async/map.js'
import { Loader } from '../loader.js'

export class Cache extends Loader {
  constructor (options = {}) {
    super(options)

    this._client = null
    this._timeouts = null
    this._ttl = null

    this.setClient(options.client)
    this.setTimeouts(options.timeouts)
    this.setTtl(options.ttl)
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  getTimeouts () {
    return this._timeouts
  }

  setTimeouts (value = new Map()) {
    this._timeouts = value
    return this
  }

  setTimeout (key, ttl) {
    if (ttl === null) {
      return
    }

    clearTimeout(this._timeouts.get(key))

    this._timeouts.set(key, setTimeout(() => {
      this.delete(key)
      this._timeouts.delete(key)
    }, ttl * 1000))
  }

  getTtl () {
    return this._ttl
  }

  setTtl (value = 60 * 60) {
    this._ttl = value
    return this
  }

  execute (actions, callback) {
    executeMap(actions, ({ key, name, ttl, value = null }, cb) => {
      if (value === null) {
        this[name](key, cb, ttl)
      } else {
        this[name](key, value, cb, ttl)
      }
    }, callback)
  }

  add () {}

  append () {}

  decrement () {}

  delete () {}

  get () {}

  increment () {}

  set () {}

  start () {}

  stop () {}
}
