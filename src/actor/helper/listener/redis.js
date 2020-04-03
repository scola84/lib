import Redis from 'ioredis'
import { Listener } from './listener.js'

export class RedisListener extends Listener {
  setClient (value = null) {
    if (this._client !== null) {
      this._client.quit()
    }

    if (value === null) {
      this._client = null
      return this
    }

    this._client = this.newModule('Redis', value)

    this._client.on('message', (channel, message) => {
      try {
        this.call(JSON.parse(message))
      } catch (error) {
        /**/
      }
    })

    this._client.subscribe('worker')

    return this
  }

  setModules (value = { Redis }) {
    return super.setModules(value)
  }

  call (message) {
    const {
      id,
      method = 'call',
      args = [],
      host = this._hostname
    } = message

    if (host !== this._hostname) {
      return
    }

    if (this._workers.has(id)) {
      this._workers.get(id)[method](...args)
    }
  }
}
