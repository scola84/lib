import { Cache } from './cache.js'

export class WindowCache extends Cache {
  add (key, value, callback = () => {}, ttl = this._ttl) {
    if (this._client.getItem(String(key)) === null) {
      callback(null)
      return
    }

    this._client.setItem(String(key), value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  append (key, value, callback = () => {}, ttl = this._ttl) {
    const current = this._client.getItem(String(key)) !== null
      ? this._client.getItem(String(key))
      : ''

    this._client.setItem(String(key), current + value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  decrement (key, value, callback = () => {}, ttl = this._ttl) {
    const current = this._client.getItem(String(key)) !== null
      ? this._client.getItem(String(key))
      : 0

    this._client.setItem(String(key), current - value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  delete (key, callback = () => {}) {
    this._client.removeItem(String(key))
    callback(null)
  }

  get (key, callback = () => {}) {
    const value = this._client.getItem(String(key))
    callback(null, value)
    return value
  }

  increment (key, value, callback = () => {}, ttl = this._ttl) {
    const current = this._client.getItem(String(key)) !== null
      ? this._client.getItem(String(key))
      : 0

    this._client.setItem(String(key), current + value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }

  set (key, value, callback = () => {}, ttl = this._ttl) {
    this._client.setItem(String(key), value)
    this.setTimeout(String(key), ttl)

    callback(null)
  }
}
