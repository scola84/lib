import { Loader } from '../../../../helper/index.js'

export class Auth extends Loader {
  constructor (options = {}) {
    super(options)

    this._credentials = null
    this._origin = null

    this.setCredentials(options.credentials)
    this.setOrigin(options.origin)
  }

  getCredentials () {
    return this._credentials
  }

  setCredentials (value = {}) {
    this._credentials = value
    return this
  }

  getOrigin () {
    return this._origin
  }

  setOrigin (value = null) {
    this._origin = value
    return this
  }

  createHeader () {}
}
