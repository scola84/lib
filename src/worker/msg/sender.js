import { Builder } from '../core'
import * as map from './sender/map'

export class MsgSender extends Builder {
  static setup () {
    MsgSender.attachFactories(MsgSender, map)
  }

  constructor (options = {}) {
    super(options)

    this._name = null
    this._transport = null

    this.setName(options.name)
    this.setTransport(options.transport)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      name: this._name,
      transport: this._transport
    }
  }

  getName () {
    return this._name
  }

  setName (value = 'default') {
    this._name = value
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
      this.createTransport(box, data)
    }

    const message = this.createMessage(data)

    this._transport.send(message, (error, result) => {
      if (error !== null) {
        this.fail(box, error)
        return
      }

      this.pass(box, data, result)
    })
  }

  createMessage (data) {
    const message = {
      ...data
    }

    message.subject = this.format(data.subject, [data.data])
    message.text = this.format(data.text, [data.data])

    if (data.html !== undefined) {
      message.html = this.format(
        data.html.replace(/%([^s])/g, '%%$1'),
        [vsprintf('%m', [data.text])]
      )
    }

    return message
  }

  createTransport (box, data) {
    let name = this._name

    if (typeof name === 'function') {
      name = name(box, data)
    }

    let options = this.getConfig(`msg.${name}`) || name

    if (typeof options === 'function') {
      options = options(box, data)
    }

    if (this[options.transport] === undefined) {
      throw new Error('Transport not defined')
    }

    this.setTransport(this[options.transport]().options(options))
  }
}
