import { Action } from '../action.js'

const handlers = {}

export class Call extends Action {
  static getHandler (name) {
    return handlers[name]
  }

  static setHandler (name, value) {
    handlers[name] = value
    return handlers
  }

  constructor (options = {}) {
    super(options)

    this._name = null
    this.setName(options.value)
  }

  getName () {
    return this._name
  }

  setName (value = null) {
    this._name = value
    return this
  }

  name (value) {
    return this.setName(value)
  }

  resolveAfter (box, data) {
    if (typeof handlers[this._name] !== 'object') {
      return
    }

    handlers[this._name].handle(box, data, (error) => {
      if (error !== null) {
        this.fail(box, error)
      } else {
        this.pass(box, data)
      }
    })
  }
}
