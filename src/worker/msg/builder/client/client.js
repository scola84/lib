export class Client {
  constructor (options = {}) {
    this._transport = null
    this.setTransport(options.transport)
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
