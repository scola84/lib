export class Listener {
  constructor () {
    this._client = null
    this._hostname = null
  }

  getClient () {
    return this._client
  }

  setClient () {}

  getHostname () {
    return this._hostname
  }

  setHostname (value = null) {
    this._hostname = value
    return this
  }
}
