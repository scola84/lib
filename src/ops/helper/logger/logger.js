import isError from 'lodash/isError.js'
import { Loader } from '../loader.js'

export class Logger extends Loader {
  constructor (options = {}) {
    super(options)

    this._client = null
    this._ids = null
    this._types = null

    this.setClient(options.client)
    this.setIds(options.ids)
    this.setTypes(options.types)
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  getIds () {
    return this._ids
  }

  setIds (value = '') {
    this._ids = new Set(value.split(','))
    return this
  }

  callId (name, ...args) {
    return this._ids[name](...args)
  }

  getTypes () {
    return this._types
  }

  setTypes (value = 'decide,fail,filter,info,merge,pass') {
    this._types = new Set(value.split(','))
    return this
  }

  callType (name, ...args) {
    return this._types[name](...args)
  }

  log (id, type, message, args = [], rid = null) {
    if (this._types.has(type) === false) {
      return
    }

    if (isError(args[0]) === true) {
      if (args[0].logged === true) {
        return
      }

      Object.defineProperty(args[0], 'logged', { value: true })
    }

    const prefix = this._ids.has(rid) === true ? rid : 'log'

    this.write(type, `${prefix}:${id}`, message, args)
  }

  write () {}
}
