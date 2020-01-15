import { SessionCache } from './session.js'

export class LocalCache extends SessionCache {
  setClient (value = window.localStorage) {
    if (value === null) {
      this._client = null
      return this
    }

    this._client = value
    return this
  }
}
