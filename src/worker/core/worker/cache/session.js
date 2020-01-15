import { Cache } from './cache.js'

export class SessionCache extends Cache {
  setClient (value = window.sessionStorage) {
    if (value === null) {
      this._client = null
      return this
    }

    this._client = value
    return this
  }

  add (key, value, callback = () => {}, ttl = null) {
    if (this._client.getItem(key) === null) {
      callback(null)
      return
    }

    this._client.setItem(key, value)
    callback(null)
  }

  append (key, value, callback = () => {}, ttl = null) {
    const current = this._client.getItem(key) !== null
      ? this._client.getItem(key)
      : ''

    this._client.setItem(key, current + value)
    callback(null)
  }

  decrement (key, value, callback = () => {}, ttl = null) {
    const current = this._client.getItem(key) !== null
      ? this._client.getItem(key)
      : 0

    this._client.setItem(key, current - value)
    callback(null)
  }

  delete (key, callback) {
    this._client.removeItem(key)
    callback(null)
  }

  get (key, callback) {
    callback(null, this._client.getItem(key))
  }

  increment (key, value, callback = () => {}, ttl = null) {
    const current = this._client.getItem(key) !== null
      ? this._client.getItem(key)
      : 0

    this._client.setItem(key, current + value)
    callback(null)
  }

  set (key, value, callback = () => {}, ttl = null) {
    this._client.setItem(key, value)
    callback(null)
  }
}
