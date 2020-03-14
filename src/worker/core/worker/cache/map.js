import { Cache } from './cache.js'

export class MapCache extends Cache {
  constructor () {
    super()
    this.setClient()
  }

  setClient (value = new Map()) {
    if (value === null) {
      this._client = null
      return this
    }

    this._client = value
    return this
  }

  add (key, value, callback = () => {}, ttl = null) {
    if (this._client.has(key) === true) {
      callback(null)
      return
    }

    this._client.set(key, value)
    callback(null)
  }

  append (key, value, callback = () => {}, ttl = null) {
    const current = this._client.has(key) === true
      ? this._client.get(key)
      : ''

    this._client.set(key, current + value)
    callback(null)
  }

  decrement (key, value, callback = () => {}, ttl = null) {
    const current = this._client.has(key) === true
      ? this._client.get(key)
      : 0

    this._client.set(key, current - value)
    callback(null)
  }

  delete (key, callback) {
    this._client.delete(key)
    callback(null)
  }

  get (key, callback) {
    const value = this._client.get(key)
    callback(null, value)
    return value
  }

  increment (key, value, callback = () => {}, ttl = null) {
    const current = this._client.has(key) === true
      ? this._client.get(key)
      : 0

    this._client.set(key, current + value)
    callback(null)
  }

  set (key, value, callback = () => {}, ttl = null) {
    this._client.set(key, value)
    callback(null)
  }
}
