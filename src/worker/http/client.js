import fetch from 'node-fetch'
import { Worker } from '../core/index.js'
import { Request } from './client/message/index.js'

export class HttpClient extends Worker {
  static parse (resource) {
    if (typeof resource === 'object' && resource !== null) {
      return resource
    }

    let [method, url = null] = resource.split(' ')

    if (url === null) {
      url = method
      method = undefined
    }

    return {
      method,
      url
    }
  }

  static request (resource, callback, progress) {
    const client = new HttpClient({
      progress
    })

    client.connect(new Worker({
      act: (box, responseData) => {
        callback(null, responseData)
      },
      err: (box, error) => {
        callback(error)
      }
    }))

    client.call({}, HttpClient.parse(resource))
  }

  constructor (options = {}) {
    super(options)

    this._progress = null
    this.setProgress(options.progress)
  }

  getProgress () {
    return this._progress
  }

  setProgress (value = () => {}) {
    this._progress = value
    return this
  }

  act (box, data) {
    const { url, body } = data

    const init = {
      ...data,
      body: null
    }

    const request = new Request(new fetch.Request(url, init))

    this.log('info', 'Handling request "%s %s" %j', [
      request.getMethod(),
      request.original.url,
      request.getHeaders()
    ])

    this._progress(box, {
      loaded: 1,
      total: 10
    })

    request.parent = this

    request.send(body, (requestError, response) => {
      if (requestError !== null) {
        this.handleError(box, data, requestError)
        return
      }

      this.handleResponse(box, data, response)
    })
  }

  handleError (box, data, error, messageData = {}, code = 400) {
    this._progress(box, {
      loaded: 1,
      total: 1
    })

    const failError = new Error(`${code} ${error.message}`.trim())

    failError.code = code
    failError.data = messageData
    failError.original = data
    failError.type = code

    if (typeof failError.data.data === 'object') {
      failError.data = failError.data.data
    }

    if (failError.data.type) {
      failError.type = failError.data.type
    }

    this.fail(box, failError)
  }

  handleResponse (box, data, response) {
    this.log('info', 'Handling response "%s" %j', [
      response.getStatus(),
      response.getHeaders()
    ])

    response.parent = this

    response.decode((decoderError, decoderData) => {
      if (decoderError !== null) {
        this.handleError(box, data, decoderError, decoderData)
        return
      }

      if (response.getStatus() >= 400) {
        this.handleError(box, data, new Error(response.original.statusText || ''),
          decoderData, response.getStatus())
        return
      }

      this.pass(box, decoderData, response, data)
    }, (loaded) => {
      this._progress(box, {
        loaded,
        total: response.getHeader('Content-Length')
      })
    })
  }
}
