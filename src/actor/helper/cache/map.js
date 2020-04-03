import isArray from 'lodash/isArray.js'
import { Cache } from './cache.js'

export class MapCache extends Cache {
  add (key, value, callback = () => {}, ttl = this._ttl) {
    if (this._client.has(String(key)) === true) {
      callback(null)
      return
    }

    this._client.set(String(key), value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  append (key, value, callback = () => {}, ttl = this._ttl) {
    let oldValue = isArray(value) ? [] : ''

    if (this._client.has(String(key)) === true) {
      oldValue = this._client.get(String(key))
    }

    const newValue = isArray(value) === true
      ? [...oldValue, ...value]
      : oldValue + value

    this._client.set(String(key), newValue)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  decrement (key, value, callback = () => {}, ttl = this._ttl) {
    const oldValue = this._client.has(String(key)) === true
      ? this._client.get(String(key))
      : 0

    this._client.set(String(key), oldValue - value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  delete (key, callback = () => {}) {
    this._client.delete(String(key))
    this.setTimeout(String(key), null)
    callback(null)
  }

  get (key, callback = () => {}) {
    const value = this._client.get(String(key))
    callback(null, value)
    return value
  }

  increment (key, value, callback = () => {}, ttl = this._ttl) {
    const oldValue = this._client.has(String(key)) === true
      ? this._client.get(String(key))
      : 0

    this._client.set(String(key), oldValue + value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  set (key, value, callback = () => {}, ttl = this._ttl) {
    this._client.set(String(key), value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }
}
