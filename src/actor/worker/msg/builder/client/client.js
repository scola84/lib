import { Loader } from '../../../../helper/index.js'

export class Client extends Loader {
  constructor (options = {}) {
    super(options)

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

  getTransport () {
    return this._transport
  }

  setTransport (value = null) {
    this._transport = value
    return this
  }

  prepareProperty (message, name) {
    return this._origin.format(message[name], [message], message.locale)
  }

  sendMessage () {}
}
