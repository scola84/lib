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

  connectClient (callback) {
    callback(null, this._transport)
  }

  prepareMessage (message) {
    if (typeof message.text === 'string') {
      message.text = this._origin.format(message.text, [message], message.locale)
    }

    return message
  }

  sendMessage (message, callback) {
    this.connectClient((connectError, connection) => {
      if (connectError !== null) {
        callback(connectError)
        return
      }

      connection.send(this.prepareMessage(message), (sendError, result) => {
        if (sendError !== null) {
          callback(sendError)
          return
        }

        callback(null, result)
      })
    })
  }
}
