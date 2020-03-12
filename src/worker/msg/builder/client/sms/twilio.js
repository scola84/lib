import twilio from 'twilio'

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

    this._client = twilio(username, password)
    return this
  }

  send (message, callback) {
    const sms = {
      body: message.text,
      from: message.from,
      to: message.to
    }

    this._client.messages.create(sms, (error, result) => {
      if (error !== null) {
        callback(error)
        return
      }

      callback(null, result)
    })
  }
}
