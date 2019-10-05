import nodemailer from 'nodemailer'
import { Transport } from './transport'
const clients = {}

export class Nodemailer extends Transport {
  open (callback) {
    const host = this._options.host

    if (clients[host] === undefined) {
      clients[host] = nodemailer.createTransport(this._options)
    }

    callback(null, clients[host])
  }

  send (message, callback) {
    this.open((error, client) => {
      if (error) {
        callback(error)
        return
      }

      client.sendMail(message, callback)
    })
  }
}
