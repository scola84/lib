import { Builder } from '../core/index.js'
import * as map from './builder/map/index.js'

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

    this.log('info', 'Sending message "%s" %j',
      [client.constructor.name.toUpperCase(), message], box.rid)

    client.send(message, (error, result) => {
      if (error !== null) {
        this.fail(box, error)
        return
      }

      this.log('info', 'Sent message "%s" %j',
        [client.constructor.name.toUpperCase(), result], box.rid)

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
    const client = this.resolve('client', box, data)

    if (clients.has(client) === true) {
      return clients.get(client)
    }

    clients.set(client, this[client.split(':').shift()]().transport(client))

    return clients.get(client)
  }

  resolveMessage (box, data) {
    const message = this.resolve('message', box, data)

    if (typeof message.subject === 'string') {
      message.subject = this.format(message.subject, [message.data], message.locale)
    }

    if (typeof message.text === 'string') {
      message.text = this.format(message.text, [message.data], message.locale)
    }

    if (typeof message.html === 'string') {
      message.html = this.format(message.html, [message.data], message.locale)
    }

    return message
  }
}

MsgBuilder.attachFactories(map)
