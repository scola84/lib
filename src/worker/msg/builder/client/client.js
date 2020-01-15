export class Client {
  constructor (options = {}) {
    this._builder = null
    this._transport = null

    this.setBuilder(options.builder)
    this.setTransport(options.transport)
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

  getTransport () {
    return this._transport
  }

  setTransport (value = null) {
    this._transport = value
    return this
  }

  transport (value) {
    return this.setTransport(value)
  }

  send () {}
}
