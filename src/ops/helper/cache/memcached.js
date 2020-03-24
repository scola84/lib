import Memcached from 'memcached'
import { Cache } from './cache.js'

export class MemcachedCache extends Cache {
  setClient (value = null) {
    if (this._client !== null) {
      this._client.quit()
    }

    if (value === null) {
      this._client = null
      return this
    }

    this._client = this.newModule('Memcached', value)
    return this
  }

  setModules (value = { Memcached }) {
    return super.setModules(value)
  }

  add (key, value, callback = () => {}, ttl = null) {
    this._client.add(key, value, ttl, callback)
  }

  append (key, value, callback = () => {}, ttl = null) {
    this._client.append(key, value, callback)
  }

  decrement (key, value, callback = () => {}, ttl = null) {
    this._client.decr(key, value, callback)
  }

  delete (key, callback = () => {}) {
    this._client.del(key, callback)
  }

  get (key, callback = () => {}) {
    this._client.get(key, callback)
  }

  increment (key, value, callback = () => {}, ttl = null) {
    this._client.incr(key, value, callback)
  }

  set (key, value, callback = () => {}, ttl = null) {
    this._client.set(key, value, ttl, callback)
  }
}
