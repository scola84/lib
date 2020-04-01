import isArray from 'lodash/isArray.js'
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

    this._client = this.newModule('Redis', value)
    return this
  }

  setModules (value = { Redis }) {
    return super.setModules(value)
  }

  setTimeout (key, ttl, command) {
    if (ttl !== null) {
      command.expire(key, ttl)
    }
  }

  add (key, value, callback = () => {}, ttl = this._ttl) {
    const command = this._client.multi()
    this.setTimeout(key, ttl, command.setnx(key, value))
    command.exec(callback)
  }

  append (key, value, callback = () => {}, ttl = this._ttl) {
    const command = this._client.multi()

    if (isArray(value) === true) {
      this.setTimeout(key, ttl, command.rpush(key, ...value))
    } else {
      this.setTimeout(key, ttl, command.append(key, value))
    }

    command.exec(callback)
  }

  decrement (key, value, callback = () => {}, ttl = this._ttl) {
    const command = this._client.multi()

    if (isArray(key) === true) {
      this.setTimeout(key[0], ttl, command.hincrby(...key, -1 * value))
    } else {
      this.setTimeout(key, ttl, command.incrby(key, -1 * value))
    }

    command.exec(callback)
  }

  delete (key, callback = () => {}) {
    if (isArray(key) === true) {
      this._client.hdel(...key, callback)
    } else {
      this._client.del(key, callback)
    }
  }

  get (key, callback = () => {}) {
    if (isArray(key) === true) {
      if (key.length === 1) {
        this._client.hgetall(...key, callback)
      } else if (key.length === 2) {
        this._client.hget(...key, callback)
      } else if (key.length === 3) {
        this._client.lrange(...key, callback)
      } else {
        callback()
      }
    } else {
      this._client.get(key, callback)
    }
  }

  increment (key, value, callback = () => {}, ttl = this._ttl) {
    const command = this._client.multi()

    if (isArray(key) === true) {
      this.setTimeout(key[0], ttl, command.hincrby(...key, value))
    } else {
      this.setTimeout(key, ttl, command.incrby(key, value))
    }

    command.exec(callback)
  }

  set (key, value, callback = () => {}, ttl = this._ttl) {
    const command = this._client.multi()

    if (isArray(key) === true) {
      this.setTimeout(key[0], ttl, command.hset(...key, value))
    } else {
      this.setTimeout(key, ttl, command.set(key, value))
    }

    command.exec(callback)
  }
}
