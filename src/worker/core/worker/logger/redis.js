/* eslint-disable no-console */

import RedisClient from 'ioredis'
import util from 'util'
import { Logger } from './logger.js'

export class RedisLogger extends Logger {
  constructor () {
    super()
    this._client = null
  }

  getClient () {
    return this._client
  }

  setClient (value = 'redis://redis') {
    if (this._client !== null) {
      this._client.quit()
    }

    if (value === null) {
      this._client = null
      return this
    }

    this._client = new RedisClient(value)

    this._client.on('error', (error) => {
      console.log(error.message)
    })

    return this
  }

  write (type, pid, message, args) {
    this._client.lpush(pid, util.format(`[${type}] ${message}`, ...args))
  }
}
