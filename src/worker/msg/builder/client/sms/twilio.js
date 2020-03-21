import isError from 'lodash/isError.js'
import twilio from 'twilio'
import { Loader } from '../../../../../helper/index.js'

export class Twilio {
  constructor (options = {}) {
    this._client = null
    this.setClient(options.client)
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    if (value === null) {
      return this
    }

    const [,
      username,
      password
    ] = value.match(/^sms:\/\/(.+):(.+)@twilio/) || []

    this._client = this._modules.twilio(username, password)
    return this
  }

  setModules (value = { twilio }) {
    return super.setModules(value)
  }

  send (message, callback) {
    const sms = {
      body: message.text,
      from: message.from,
      to: message.to
    }

    this._client.messages.create(sms, (error, result) => {
      if (isError(error) === true) {
        callback(error)
        return
      }

      callback(null, result)
    })
  }
}
