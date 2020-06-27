import isError from 'lodash/isError.js'
import isFunction from 'lodash/isFunction.js'
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
    if (isFunction(handlers[this._name]) === false) {
      return
    }

    handlers[this._name](box, data, (error) => {
      if (isError(error) === true) {
        this.fail(box, error)
        return
      }

      this.pass(box, data)
    })
  }
}
