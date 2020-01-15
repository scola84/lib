import nodemailer from 'nodemailer'
import { Client } from './client.js'

export class Smtp extends Client {
  setTransport (value = null) {
    if (this._transport !== null) {
      this._transport.close()
    }

    if (value === null) {
      this._transport = null
      return this
    }

    this._transport = nodemailer.createTransport(value)
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

      transport.sendMail(message, (error, result) => {
        if (error !== null) {
          callback(error)
          return
        }

        callback(null, result)
      })
    })
  }
}
