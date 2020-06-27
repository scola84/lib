import isError from 'lodash/isError.js'
import isFunction from 'lodash/isFunction.js'
import { Builder } from '../core/index.js'
import { map as clientMap } from './builder/client/index.js'

const clients = new Map()

export class MsgBuilder extends Builder {
  constructor (options = {}) {
    super(options)

    this._build = null
    this._client = null
    this._rehearse = null

    this.setClient(options.client)
    this.setBuild(options.build)
    this.setRehearse(options.rehearse)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      build: this._build,
      client: this._client,
      rehearse: this._rehearse
    }
  }

  getBuild () {
    return this._build
  }

  setBuild (value = null) {
    this._build = value
    return this
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  getRehearse () {
    return this._rehearse
  }

  setRehearse (value = false) {
    this._rehearse = value
    return this
  }

  act (box, data) {
    const client = this.resolveClient(box, data)
    const message = this.resolve('build', box, data)

    this.log('info', 'Sending message %o', [message], box.rid)

    if (this._rehearse === true) {
      this.pass(box, data)
      return
    }

    client.sendMessage(message, (error, result) => {
      if (isError(error) === true) {
        this.fail(box, data, error)
        return
      }

      this.pass(box, data, result)
    })
  }

  build (box, data) {
    return {
      ...data
    }
  }

  client () {
    return 'smtp://smtp:25?pool=true'
  }

  resolveClient (box, data) {
    const client = this.resolve('client', box, data)

    if (clients.has(client) === false) {
      const type = client.split(':').shift()

      if (isFunction(this[type]) === true) {
        clients.set(client, this[type]().setTransport(client))
      } else {
        throw new Error(`Could not resolve client for "${client}"`)
      }
    }

    return clients.get(client)
  }
}

MsgBuilder.attachFactories({ clientMap })
