import merge from 'lodash-es/merge'
import superagent from 'superagent'
import { HttpWorker } from './worker'

const wcodecs = HttpWorker.createCodecs()

const wmeta = {
  headers: {
    'Content-Type': 'application/json'
  },
  method: 'GET'
}

export class HttpClient extends HttpWorker {
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
    let {
      meta: requestMeta,
      data: requestData
    } = data

    const cmeta = this.getConfig('http.client') || {}

    requestMeta = merge({}, wmeta, cmeta, requestMeta)
    requestData = requestMeta.method === 'GET' ? null : requestData

    const request = superagent(requestMeta.method, requestMeta.url)

    Object.keys(requestMeta.headers).forEach((name) => {
      if (requestData === null && name === 'Content-Type') {
        return
      }

      request.set(name, requestMeta.headers[name])
    })

    this.patchRequest(box, request)
    this.handleRequest(box, data, request, requestData)
  }

  handleError (box, data, error, messageData, status = 400) {
    this._progress(box, {
      lengthComputable: true,
      loaded: 1,
      total: 1
    })

    const failError = new Error(`${status} ${error.message}`.trim())

    failError.data = messageData === undefined || messageData === null
      ? messageData
      : messageData.data

    failError.original = data
    failError.status = status

    this.fail(box, failError)
  }

  handleRequest (box, data, request, requestData) {
    const type = request.parseHeader('content-type')

    const encoder = wcodecs[type.value] === undefined
      ? wcodecs['application/octet-stream']
      : wcodecs[type.value]

    encoder.encode(request, requestData, (encoderError, encoderData) => {
      if (encoderError !== null) {
        this.handleError(box, data, encoderError, requestData)
        return
      }

      this._progress(box, {
        lengthComputable: true,
        loaded: 1,
        total: 10
      })

      if (type.value === 'multipart/form-data') {
        request.setHeader('Content-Type', null)
      }

      request
        .write(encoderData)
        .end((error, response) => {
          if (error !== null) {
            this.handleError(box, data, error, encoderData,
              response && response.statusCode)
            return
          }

          this.patchResponse(box, response)
          this.handleResponse(box, data, response)
        })
    })
  }

  handleResponse (box, data, response) {
    const type = response.parseHeader('content-type')

    const decoder = wcodecs[type.value] === undefined
      ? wcodecs['application/octet-stream']
      : wcodecs[type.value]

    decoder.decode(response, (decoderError, responseData) => {
      if (decoderError !== null) {
        this.handleError(box, data, decoderError, responseData)
        return
      }

      if (response.statusCode >= 400) {
        this.handleError(box, data, new Error(response.statusText || ''),
          responseData, response.statusCode)
        return
      }

      this.pass(box, data, response, responseData)
    })
  }

  merge (box, data, response, responseData) {
    if (responseData === undefined || responseData.data === undefined) {
      return {}
    }

    return responseData.data
  }

  patchRequest (box, request) {
    request.getHeader = (name) => request._header[name]
    request.parseHeader = (name) => this.parseHeader(request.getHeader(name))
    request.setHeader = request.set
    request.write = request.send

    request.on('progress', (event) => {
      this._progress(box, event)
    })
  }

  patchResponse (box, response) {
    response.getHeader = (name) => response.headers[name]
    response.parseHeader = (name) => this.parseHeader(response.getHeader(name))

    response.on = (name, handler) => {
      if (name === 'data') {
        handler(Buffer.from(response.text))
      } else if (name === 'end') {
        handler()
      }
    }

    response.once = response.on
  }
}
