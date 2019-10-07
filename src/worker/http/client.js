import merge from 'lodash-es/merge'
import superagent from 'superagent'
import { Worker } from '..'
import * as codecs from '../../helper/codec'
import { parseHeader } from '../../helper/parse'

const wcodecs = Object.keys(codecs).reduce((object, name) => {
  return {
    ...object,
    [codecs[name].type()]: new codecs[name]()
  }
}, {})

const wmeta = {
  headers: {
    'Content-Type': 'application/json'
  },
  method: 'GET'
}

export class HttpClient extends Worker {
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

  act (box, boxData) {
    const {
      meta,
      data
    } = this.filter(box, boxData)

    const cmeta = this._config.http === undefined
      ? {}
      : this._config.http.client

    const requestMeta = merge({}, wmeta, cmeta, meta)
    const requestData = requestMeta.method === 'GET' ? null : data

    const request = superagent(requestMeta.method, requestMeta.url)

    Object.keys(requestMeta.headers).forEach((name) => {
      if (requestData === null && name === 'Content-Type') {
        return
      }

      request.set(name, requestMeta.headers[name])
    })

    this.patchRequest(box, request)
    this.handleRequest(box, boxData, request, requestData)
  }

  handleError (box, boxData, messageData, error, status = 400) {
    this._progress(box, {
      lengthComputable: true,
      loaded: 1,
      total: 1
    })

    const failError = new Error(`${status} ${error.message}`.trim())

    failError.data = messageData ? messageData.data : messageData
    failError.original = boxData
    failError.status = status

    this.fail(box, failError)
  }

  handleRequest (box, boxData, request, requestData) {
    const type = parseHeader(request.getHeader('content-type'))

    const encoder = wcodecs[type.value] === undefined
      ? wcodecs['application/octet-stream']
      : wcodecs[type.value]

    encoder.encode(request, requestData, (encoderError, encoderData) => {
      if (encoderError !== null) {
        this.handleError(box, boxData, requestData, encoderError)
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
            this.handleError(box, boxData, encoderData, error,
              response && response.statusCode)
            return
          }

          this.patchResponse(box, response)
          this.handleResponse(box, boxData, response)
        })
    })
  }

  handleResponse (box, boxData, response) {
    const type = parseHeader(response.headers['content-type'])

    const decoder = wcodecs[type.value] === undefined
      ? wcodecs['application/octet-stream']
      : wcodecs[type.value]

    decoder.decode(response, (decoderError, decoderData) => {
      if (decoderError !== null) {
        this.handleError(box, boxData, decoderData, decoderError)
        return
      }

      if (response.statusCode >= 400) {
        this.handleError(box, boxData, decoderData,
          new Error(response.statusText || ''), response.statusCode)
        return
      }

      this.pass(box, this.merge(response, decoderData, boxData))
    })
  }

  merge (box, data, ...extra) {
    if (this._merge !== null) {
      return this._merge(box, data, ...extra)
    }

    return data === undefined || data.data === undefined
      ? data
      : data.data
  }

  patchRequest (box, request) {
    request.getHeader = (name) => request._header[name]
    request.setHeader = request.set
    request.write = request.send

    request.on('progress', (event) => {
      this._progress(box, event)
    })
  }

  patchResponse (box, response) {
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
