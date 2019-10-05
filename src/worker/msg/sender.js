import { vsprintf } from '../../helper'
import { Builder } from '../core'
import * as map from './sender/map'

let hosts = {}

export class MsgSender extends Builder {
  static setup () {
    MsgSender.attachFactories(MsgSender, map)
  }

  static getHosts () {
    return hosts
  }

  static setHosts (value) {
    hosts = value
  }

  constructor (options = {}) {
    super(options)

    this._host = null
    this._transport = null

    this.setHost(options.host)
    this.setTransport(options.transport)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      host: this._host,
      transport: this._transport
    })
  }

  getHost () {
    return this._host
  }

  setHost (value = 'default') {
    this._host = value
    return this
  }

  getTransport () {
    return this._transport
  }

  setTransport (value = null) {
    this._transport = value
    return this
  }

  act (box, data) {
    if (this._transport === null) {
      this.createTransport()
    }

    const message = this.sprintf(
      this.filter(box, data)
    )

    this._transport.send(message, (error, result) => {
      if (error) {
        this.handleError(box, data, error)
        return
      }

      this.handleSend(box, data, result)
    })
  }

  createTransport () {
    const options = hosts[this._host] || {}

    if (this[options.transport] === undefined) {
      throw new Error('Transport not defined')
    }

    this.setTransport(
      this[options.transport]().options(options)
    )
  }

  handleError (box, data, error) {
    error.data = data
    this.fail(box, error)
  }

  handleSend (box, data, result) {
    try {
      data = this.merge(box, data, { result })
      this.pass(box, data)
    } catch (error) {
      this.handleError(box, data, error)
    }
  }

  sprintf (data) {
    data.subject = vsprintf(data.subject, [data.data])
    data.text = vsprintf(data.text, [data.data])

    if (data.html !== undefined) {
      data.html = vsprintf(
        data.html.replace(/%([^s])/g, '%%$1'),
        [vsprintf('%m', [data.text])]
      )
    }

    return data
  }
}
