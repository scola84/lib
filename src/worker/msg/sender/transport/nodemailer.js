import nodemailer from 'nodemailer'
import { Transport } from './transport'

const clients = {}

export class Nodemailer extends Transport {
  open (callback) {
    const { host } = this._options

    if (clients[host] === undefined) {
      clients[host] = nodemailer.createTransport(this._options)
    }

    callback(null, clients[host])
  }

  send (message, callback) {
    this.open((openError, client) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      client.sendMail(message, (error, result) => {
        if (error !== null) {
          callback(error)
          return
        }

        callback(null, result)
      })
    })
  }
}
