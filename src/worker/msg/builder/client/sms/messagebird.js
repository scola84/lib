import isError from 'lodash/isError.js'
import messagebird from 'messagebird'
import { Loader } from '../../../../../helper/index.js'

export class Messagebird extends Loader {
  constructor (options = {}) {
    super(options)

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

    const [, ,
      key
    ] = value.match(/^sms:\/\/(.+):(.+)@messagebird/) || []

    this._client = this._modules.messagebird(key)
    return this
  }

  setModules (value = { messagebird }) {
    return super.setModules(value)
  }

  send (message, callback) {
    const sms = {
      originator: message.from,
      recipients: [
        message.to
      ],
      body: message.text
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
