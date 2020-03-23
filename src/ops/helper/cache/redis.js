import Redis from 'ioredis'
import { Cache } from './cache.js'

export class RedisCache extends Cache {
  setClient (value = null) {
    if (this._client !== null) {
      this._client.quit()
    }

    if (value === null) {
      this._client = null
      return this
    }

    this._client = new this._modules.Redis(value)
    return this
  }

  setModules (value = { Redis }) {
    return super.setModules(value)
  }

  add (key, value, callback = () => {}, ttl = null) {
    const command = this._client
      .multi()
      .setnx(key, value)

    if (ttl !== null) {
      command.pexpire(key, ttl)
    }

    command.exec(callback)
  }

  append (key, value, callback = () => {}, ttl = null) {
    const command = this._client
      .multi()
      .append(key, value)

    if (ttl !== null) {
      command.pexpire(key, ttl)
    }

    command.exec(callback)
  }

  decrement (key, value, callback = () => {}, ttl = null) {
    const command = this._client
      .multi()
      .decrby(key, value)

    if (ttl !== null) {
      command.pexpire(key, ttl)
    }

    command.exec(callback)
  }

  delete (key, callback = () => {}) {
    this._client.delete(key, callback)
  }

  get (key, callback = () => {}) {
    this._client.get(key, callback)
  }

  increment (key, value, callback = () => {}, ttl = null) {
    const command = this._client
      .multi()
      .incrby(key, value)

    if (ttl !== null) {
      command.pexpire(key, ttl)
    }

    command.exec(callback)
  }

  set (key, value, callback = () => {}, ttl = null) {
    const command = this._client
      .multi()
      .set(key, value)

    if (ttl !== null) {
      command.pexpire(key, ttl)
    }

    command.exec(callback)
  }
}
