import messagebird from 'messagebird'

export class Messagebird {
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

    const [, ,
      key
    ] = value.match(/^sms:\/\/(.+):(.+)@messagebird/) || []

    this._client = messagebird(key)
    return this
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
      if ((error instanceof Error) === true) {
        callback(error)
        return
      }

      callback(null, result)
    })
  }
}
