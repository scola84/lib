import RedisClient from 'ioredis'
import { Worker } from '../../worker.js'
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

    this._client = new RedisClient(value)

    this._client.on('message', (channel, message) => {
      try {
        this.call(JSON.parse(message))
      } catch (error) {
        new Worker().log('fail', '', [error])
      }
    })

    this._client.subscribe('worker')

    return this
  }

  call (message) {
    const {
      id,
      method,
      args = [],
      host = this._hostname
    } = message

    if (host !== this._hostname) {
      return
    }

    const worker = Worker.workers.get(id)

    if (worker instanceof Worker) {
      worker[method](...args)
    }
  }
}
