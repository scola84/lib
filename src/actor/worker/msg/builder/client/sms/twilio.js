import asyncMap from 'async/map.js'
import isError from 'lodash/isError.js'
import twilio from 'twilio'
import { Loader } from '../../../../../helper/index.js'

export class Twilio extends Loader {
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

    const [,
      username,
      password
    ] = value.match(/^sms:\/\/(.+):(.+)@twilio/) || []

    this._client = this.getModule('twilio')(username, password)
    return this
  }

  setModules (value = { twilio }) {
    return super.setModules(value)
  }

  send (message, callback) {
    asyncMap(message.to.split(','), (to, cb) => {
      const sms = {
        ...message,
        to
      }

      this._client.messages.create(sms, (error, result) => {
        if (isError(error) === true) {
          cb(null, error)
          return
        }

        cb(null, result)
      })
    }, (error, result) => {
      if (isError(error) === true) {
        callback(error)
        return
      }

      callback(null, result.reduce((object, item) => {
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
