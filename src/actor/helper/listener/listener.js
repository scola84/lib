import { workers } from '../../worker/core/worker.js'
import { Loader } from '../loader.js'

export class Listener extends Loader {
  constructor (options = {}) {
    super(options)

    this._client = null
    this._hostname = null
    this._workers = null

    this.setClient(options.client)
    this.setHostname(options.hostname)
    this.setWorkers(options.workers)
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  getHostname () {
    return this._hostname
  }

  setHostname (value = null) {
    this._hostname = value
    return this
  }

  getWorkers () {
    return this._workers
  }

  setWorkers (value = null) {
    this._workers = value === null
      ? workers
      : value

    return this
  }
}
