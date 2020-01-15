import { Client } from './client.js'
import * as sms from './sms/index.js'

export class Sms extends Client {
  setTransport (value = null) {
    if (value === null) {
      this._transport = null
      return this
    }

    const [, name] = this._url.split('@')
    this._transport = sms[name].create(value)

    return this
  }

  open (callback) {
    callback(null, this._transport)
  }

  send (message, callback) {
    this.open((openError, transport) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      transport.send(message, (sendError, result) => {
        if (sendError !== null) {
          callback(sendError)
          return
        }

        callback(null, result)
      })
    })
  }
}
