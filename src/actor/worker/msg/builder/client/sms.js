import isError from 'lodash/isError.js'
import isString from 'lodash/isString.js'
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

  connectTransport (callback) {
    callback(null, this._transport)
  }

  prepareMessage (message) {
    if (isString(message.text) === true) {
      message.text = this.prepareProperty(message, 'text')
    }

    return message
  }

  sendMessage (message, callback) {
    this.connectTransport((connectError, connection) => {
      if (isError(connectError) === true) {
        callback(connectError)
        return
      }

      connection.send(this.prepareMessage(message), (sendError, result) => {
        if (isError(sendError) === true) {
          callback(sendError)
          return
        }

        callback(null, result)
      })
    })
  }
}
