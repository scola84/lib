export class Cache {
  constructor (options = {}) {
    this._client = null
    this.setClient(options.client)
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  add () {}

  append () {}

  decrement () {}

  delete () {}

  get () {}

  increment () {}

  set () {}

  start () {}

  stop () {}
}
