export class Listener {
  constructor (options = {}) {
    this._client = null
    this._hostname = null

    this.setClient(options.client)
    this.setHostname(options.hostname)
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  getHostname () {
    return this._hostname
  }

  setHostname (value = null) {
    this._hostname = value
    return this
  }
}
