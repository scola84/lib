import { Snippet } from '../snippet'

const handlers = {}

export class Call extends Snippet {
  static getHandler (name) {
    return handlers[name]
  }

  static setHandler (name, fn) {
    handlers[name] = fn
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
    if (handlers[this._name]) {
      handlers[this._name].handle(box, data)
    }
  }
}
