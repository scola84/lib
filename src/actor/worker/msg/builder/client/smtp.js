import isArray from 'lodash/isArray.js'
import isError from 'lodash/isError.js'
import isNil from 'lodash/isNil.js'
import isString from 'lodash/isString.js'
import nodemailer from 'nodemailer'
import { Client } from './client.js'

export class Smtp extends Client {
  setModules (value = { nodemailer }) {
    return super.setModules(value)
  }

  setTransport (value = null) {
    if (this._transport !== null) {
      this._transport.close()
    }

    if (value === null) {
      this._transport = null
      return this
    }

    this._transport = this
      .getModule('nodemailer')
      .createTransport(value)

    return this
  }

  connectTransport (callback) {
    callback(null, this._transport)
  }

  prepareAttachments (message) {
    return message.attachments.filter((attachment) => {
      return isNil(attachment.content) === false ||
        isNil(attachment.path) === false
    })
  }

  prepareMessage (message) {
    if (isArray(message.attachments) === true) {
      message.attachments = this.prepareAttachments(message)
    }

    if (isString(message.subject) === true) {
      message.subject = this.prepareProperty(message, 'subject')
    }

    if (isString(message.text) === true) {
      message.text = this.prepareProperty(message, 'text')
    }

    if (isString(message.html) === true) {
      message.html = this.prepareProperty(message, 'html')
    }

    return message
  }

  sendMessage (message, callback) {
    this.connectTransport((connectError, connection) => {
      if (isError(connectError) === true) {
        callback(connectError)
        return
      }

      connection.sendMail(this.prepareMessage(message), (sendError, result) => {
        if (isError(sendError) === true) {
          callback(sendError)
          return
        }

        callback(null, result)
      })
    })
  }
}
