export class Client {
  constructor (options = {}) {
    this._builder = null
    this._pool = null

    this.setBuilder(options.builder)
    this.setPool(options.pool)
  }

  getBuilder () {
    return this._builder
  }

  setBuilder (value = null) {
    this._builder = value
    return this
  }

  builder (value) {
    return this.setBuilder(value)
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

  close () {}

  escape () {}

  execute () {}

  stream () {}
}
