export class Logger {
  constructor () {
    this._ids = null
    this._types = null

    this.setIds()
    this.setTypes()
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

    if (args[0] instanceof Error) {
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
