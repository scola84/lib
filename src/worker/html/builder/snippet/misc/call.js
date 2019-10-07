import { Snippet } from '../snippet'

const calls = {}

export class Call extends Snippet {
  static getCall (name) {
    return calls[name]
  }

  static setCall (name, fn) {
    calls[name] = fn
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
    if (calls[this._name]) {
      calls[this._name](box, data)
    }
  }
}
