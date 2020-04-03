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

    this._client = this.getModule('messagebird')(key)
    return this
  }

  setModules (value = { messagebird }) {
    return super.setModules(value)
  }

  send (message, callback) {
    const sms = {
      originator: message.from,
      recipients: message.to.split(','),
      body: message.text
    }

    this._client.messages.create(sms, (error, result) => {
      if (isError(error) === true) {
        callback(error)
        return
      }

      callback(null, result.recipients.items.reduce((object, item) => {
        object.total += 1
        object.failure += item.status !== 'sent' ? 1 : 0
        object.success += item.status === 'sent' ? 1 : 0
        return object
      }, {
        failure: 0,
        success: 0,
        total: 0
      }))
    })
  }
}
