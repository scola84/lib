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

  open (box, data, callback) {
    callback(null, this._transport)
  }

  prepare (message) {
    if (typeof message.subject === 'string') {
      message.subject = this._origin.format(message.subject, [message], message.locale)
    }

    if (typeof message.text === 'string') {
      message.text = this._origin.format(message.text, [message], message.locale)
    }

    if (typeof message.html === 'string') {
      message.html = this._origin.format(message.html, [message], message.locale)
    }

    return message
  }

  send (box, data, message, callback) {
    this.open((openError, transport) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      transport.sendMail(this.prepare(message), (error, result) => {
        if (error !== null) {
          callback(error)
          return
        }

        callback(null, result)
      })
    })
  }
}
