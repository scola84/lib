import Redis from 'ioredis'
import util from 'util'
import { Logger } from './logger.js'

export class RedisLogger extends Logger {
  setModules (value = { Redis }) {
    return super.setModules(value)
  }

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

  write (type, pid, message, args) {
    this._client.lpush(pid, util.format(`[${type}] ${message}`, ...args))
  }
}
