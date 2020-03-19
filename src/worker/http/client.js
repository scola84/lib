import fetch from 'node-fetch'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import { Worker } from '../core/index.js'
import { Request } from './client/message/index.js'

export class HttpClient extends Worker {
  static parse (resource) {
    if (isPlainObject(resource) === true) {
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
      progress,
      merge (box, data, decoderData) {
        return decoderData
      }
    })

    client.connect(new Worker({
      act (box, data) {
        callback(null, data)
      },
      err (box, error) {
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

    this.log('info', 'Handling request %o %o %o', [
      request.getMethod(),
      request.original.url,
      request.getHeaders()
    ])

    this._progress({
      loaded: 1,
      total: 10
    })

    request.parent = this

    request.send(body, (requestError, response) => {
      if ((requestError instanceof Error) === true) {
        this.handleError(box, data, requestError)
        return
      }

      this.handleResponse(box, data, response)
    })
  }

  handleError (box, data, error, status = 400) {
    this._progress({
      loaded: 1,
      total: 1
    })

    if (isString(error) === true) {
      this.fail(box, new Error(`${status}`))
      return
    }

    if (isPlainObject(error) === true) {
      this.fail(box, this.error(error))
      return
    }

    this.fail(box, error)
  }

  handleResponse (box, data, response) {
    this.log('info', 'Handling response %o %o', [
      response.getStatus(),
      response.getHeaders()
    ])

    response.parent = this

    response.decode((decoderError, decoderData) => {
      if ((decoderError instanceof Error) === true) {
        this.handleError(box, data, decoderError)
        return
      }

      if (response.getStatus() >= 400) {
        this.handleError(box, data, decoderData, response.getStatus())
        return
      }

      this.pass(box, data, decoderData, response)
    }, (loaded) => {
      this._progress({
        loaded,
        total: response.getHeader('Content-Length')
      })
    })
  }
}
