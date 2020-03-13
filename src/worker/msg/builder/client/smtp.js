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

  connectClient (callback) {
    callback(null, this._transport)
  }

  prepareMessage (message) {
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

  sendMessage (message, callback) {
    this.connectClient((connectError, connection) => {
      if (connectError !== null) {
        callback(connectError)
        return
      }

      connection.sendMail(this.prepareMessage(message), (error, result) => {
        if (error !== null) {
          callback(error)
          return
        }

        callback(null, result)
      })
    })
  }
}
