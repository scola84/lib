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

  add (key, value, callback = () => {}, ttl = this._ttl) {
    this._client.add(String(key), value, ttl, callback)
  }

  append (key, value, callback = () => {}, ttl = this._ttl) {
    this._client.append(String(key), value, callback)
  }

  decrement (key, value, callback = () => {}, ttl = this._ttl) {
    this._client.decr(String(key), value, callback)
  }

  delete (key, callback = () => {}) {
    this._client.del(String(key), callback)
  }

  get (key, callback = () => {}) {
    this._client.get(String(key), callback)
  }

  increment (key, value, callback = () => {}, ttl = this._ttl) {
    this._client.incr(String(key), value, callback)
  }

  set (key, value, callback = () => {}, ttl = this._ttl) {
    this._client.set(String(key), value, ttl, callback)
  }
}
