export class Client {
  constructor (options = {}) {
    this._origin = null
    this._transport = null

    this.setOrigin(options.origin)
    this.setTransport(options.transport)
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

  sendMessage () {}
}
