import { Builder } from '../core/index.js'
import map from './builder/map/client.js'

const clients = new Map()

export class MsgBuilder extends Builder {
  constructor (options = {}) {
    super(options)

    this._client = null
    this._message = null

    this.setClient(options.client)
    this.setMessage(options.message)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      client: this._client,
      message: this._message
    }
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  getMessage () {
    return this._message
  }

  setMessage (value = null) {
    this._message = value
    return this
  }

  act (box, data) {
    const client = this.resolveClient(box, data)
    const message = this.resolveMessage(box, data)

    this._origin.log('info', 'Sending message %o', [message], box.rid)

    client.sendMessage(message, (error, result) => {
      if (this.isInstance(error, Error) === true) {
        this.fail(box, error)
        return
      }

      this.pass(box, data, result)
    })
  }

  client () {
    return 'smtp://smtp:25?pool=true'
  }

  message (box, data) {
    return {
      ...data
    }
  }

  resolveClient (box, data) {
    const dsn = this.resolve('client', box, data)

    if (clients.has(dsn) === false) {
      clients.set(
        dsn,
        this[dsn.split(':').shift()]().setTransport(dsn)
      )
    }

    return clients.get(dsn)
  }

  resolveMessage (box, data) {
    return this.resolve('message', box, data)
  }
}

MsgBuilder.attachFactories({ map })
