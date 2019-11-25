import { Builder } from '../core'
import * as map from './sender/map'

export class MsgSender extends Builder {
  static setup () {
    MsgSender.attachFactories(MsgSender, map)
  }

  constructor (options = {}) {
    super(options)

    this._message = null
    this._name = null
    this._transport = null

    this.setMessage(options.message)
    this.setName(options.name)
    this.setTransport(options.transport)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      message: this._message,
      name: this._name,
      transport: this._transport
    }
  }

  getMessage () {
    return this._message
  }

  setMessage (value = null) {
    this._message = value
    return this
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

    const message = this.formatMessage(
      this.createMessage(box, data)
    )

    this._transport.send(message, (error, result) => {
      if (error !== null) {
        this.fail(box, error)
        return
      }

      this.pass(box, data, result)
    })
  }

  createMessage (box, data) {
    if (this._message !== null) {
      return this._message(box, data)
    }

    return this.message(box, data)
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
      throw new Error('500 Transport not defined')
    }

    this.setTransport(this[options.transport]().options(options))
  }

  formatMessage (message) {
    const {
      data,
      html,
      locale,
      subject,
      text
    } = message

    if (subject !== undefined) {
      message.subject = this.format(subject, [data], locale)
    }

    if (text !== undefined) {
      message.text = this.format(text, [data], locale)
    }

    if (html !== undefined) {
      message.html = this.format(
        html,
        [message],
        locale
      )
    }

    return message
  }

  message (box, data) {
    return {
      ...data
    }
  }
}
