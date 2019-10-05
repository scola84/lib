import messagebird from 'messagebird'
import { Transport } from './transport'
const clients = {}

export class Messagebird extends Transport {
  open (callback) {
    const host = this._options.host

    if (clients[host] === undefined) {
      clients[host] = messagebird(this._options.key)
    }

    callback(null, clients[host])
  }

  send (message, callback) {
    this.open((error, client) => {
      if (error) {
        callback(error)
        return
      }

      client.messages.create({
        originator: message.from,
        recipients: [
          message.to
        ],
        body: message.text
      }, callback)
    })
  }
}
