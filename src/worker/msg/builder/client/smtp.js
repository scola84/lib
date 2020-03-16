import isString from 'lodash/isString.js'
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
    if (isString(message.subject) === true) {
      message.subject = this._origin.format(message.subject, [message], message.locale)
    }

    if (isString(message.text) === true) {
      message.text = this._origin.format(message.text, [message], message.locale)
    }

    if (isString(message.html) === true) {
      message.html = this._origin.format(message.html, [message], message.locale)
    }

    return message
  }

  sendMessage (message, callback) {
    this.connectClient((connectError, connection) => {
      if ((connectError instanceof Error) === true) {
        callback(connectError)
        return
      }

      connection.sendMail(this.prepareMessage(message), (sendError, result) => {
        if ((sendError instanceof Error) === true) {
          callback(sendError)
          return
        }

        callback(null, result)
      })
    })
  }
}
