import { Client } from './client.js'
import * as sms from './sms/index.js'

export class Sms extends Client {
  setTransport (value = null) {
    if (value === null) {
      this._transport = null
      return this
    }

    const [, name] = value.split('@')
    this._transport = new sms[name]({ client: value })

    return this
  }

  open (box, data, callback) {
    callback(null, this._transport)
  }

  prepare (message) {
    if (typeof message.text === 'string') {
      message.text = this._origin.format(message.text, [message], message.locale)
    }

    return message
  }

  send (box, data, message, callback) {
    this.open(box, data, (openError, transport) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      transport.send(this.prepare(message), (sendError, result) => {
        if (sendError !== null) {
          callback(sendError)
          return
        }

        callback(null, result)
      })
    })
  }
}
