import { Builder } from '../../../core/index.js'

export class Client {
  static attachFactories (objects) {
    Reflect.apply(Builder.attachFactories, this, [objects])
  }

  constructor (options = {}) {
    this._origin = null
    this._pool = null

    this.setOrigin(options.origin)
    this.setPool(options.pool)
  }

  getOrigin () {
    return this._origin
  }

  setOrigin (value = null) {
    this._origin = value
    return this
  }

  origin (value) {
    return this.setOrigin(value)
  }

  getPool () {
    return this._pool
  }

  setPool (value = null) {
    this._pool = value
    return this
  }

  pool (value) {
    return this.setPool(value)
  }

  executeQuery () {}

  streamQuery () {}
}
