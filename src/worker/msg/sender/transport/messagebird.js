import messagebird from 'messagebird'
import { Transport } from './transport'

const clients = {}

export class Messagebird extends Transport {
  open (callback) {
    const { host } = this._options

    if (clients[host] === undefined) {
      clients[host] = messagebird(this._options.key)
    }

    callback(null, clients[host])
  }

  send (message, callback) {
    this.open((openError, client) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      const sms = {
        originator: message.from,
        recipients: [
          message.to
        ],
        body: message.text
      }

      client.messages.create(sms, (error, result) => {
        if (error !== null) {
          callback(error)
          return
        }

        callback(null, result)
      })
    })
  }
}
