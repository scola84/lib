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
    const current = this._client.has(String(key)) === true
      ? this._client.get(String(key))
      : ''

    this._client.set(String(key), current + value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  decrement (key, value, callback = () => {}, ttl = this._ttl) {
    const current = this._client.has(String(key)) === true
      ? this._client.get(String(key))
      : 0

    this._client.set(String(key), current - value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  delete (key, callback = () => {}) {
    this._client.delete(String(key))
    callback(null)
  }

  get (key, callback = () => {}) {
    const value = this._client.get(String(key))
    callback(null, value)
    return value
  }

  increment (key, value, callback = () => {}, ttl = this._ttl) {
    const current = this._client.has(String(key)) === true
      ? this._client.get(String(key))
      : 0

    this._client.set(String(key), current + value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  set (key, value, callback = () => {}, ttl = this._ttl) {
    this._client.set(String(key), value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }
}
