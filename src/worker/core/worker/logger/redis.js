import RedisClient from 'ioredis'
import util from 'util'
import { Logger } from './logger.js'

export class RedisLogger extends Logger {
  setClient (value = null) {
    if (this._client !== null) {
      this._client.quit()
    }

    if (value === null) {
      this._client = null
      return this
    }

    this._client = new RedisClient(value)
    return this
  }

  write (type, pid, message, args) {
    this._client.lpush(pid, util.format(`[${type}] ${message}`, ...args))
  }
}
