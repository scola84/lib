import parseContentType from 'content-type-parser'
import http from 'http'
import merge from 'lodash-es/merge'
import parse from 'url-parse'
import { Worker } from '../../worker'
import { codec } from '../../helper'

const wmeta = {
  headers: {
    'Content-Type': 'application/octet-stream'
  },
  mode: 'disable-fetch',
  protocol: 'https:'
}

export class HttpClient extends Worker {
  static getMeta () {
    return wmeta
  }

  static setMeta (meta) {
    merge(wmeta, meta)
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

  act (box, boxData) {
    let {
      meta,
      data
    } = this.filter(box, boxData)

    meta = parse(meta)
    meta = merge({}, wmeta, meta)

    meta.method = meta.method || 'GET'
    meta.pathname = meta.pathname || '/'
    meta.path = meta.pathname + meta.query

    data = meta.method === 'GET' ? null : data

    const request = http.request(meta)

    request.once('error', (error) => {
      this._progress({ lengthComputable: true, loaded: 1, total: 1 })
      this.handleError(box, boxData, request, data, error, 502)
    })

    request.once('response', (response) => {
      this.handleResponse(box, boxData, response)
    })

    this.handleRequest(box, boxData, request, data)
  }

  handleError (box, boxData, response, data, error, status) {
    error = new Error(`${status} ${error.message}`.trim())

    error.data = data
    error.status = status

    this.fail(box, this.merge(response, data, boxData, error))
  }

  handleRequest (box, boxData, request, data) {
    const type = parseContentType(request.getHeader('content-type'))

    const encoder =
      (type && codec[`${type.type}/${type.subtype}`]) ||
      codec['application/octet-stream']

    encoder.encode(request, data, (encodeError) => {
      if (encodeError) {
        this.handleError(box, boxData, request, data, encodeError, 400)
      }
    })
  }

  handleResponse (box, boxData, response) {
    if (response._xhr) {
      response._xhr.onprogress = (event) => {
        this._progress(event)
      }

      this._progress({ lengthComputable: true, loaded: 1, total: 10 })
    }

    const type = parseContentType(response.headers['content-type'])

    const decoder =
      (type && codec[`${type.type}/${type.subtype}`]) ||
      codec['application/octet-stream']

    decoder.decode(response, (decodeError, data) => {
      if (decodeError) {
        this.handleError(box, boxData, response, data, decodeError, 400)
        return
      }

      if (response.statusCode >= 400) {
        this.handleError(box, boxData, response, data,
          new Error(response.statusText || ''), response.statusCode)
        return
      }

      this.pass(box, this.merge(response, data, boxData))
    })
  }

  merge (response, data, boxData, error) {
    if (this._merge) {
      return this._merge(response, data, boxData, error)
    }

    if (error) {
      return error
    }

    return data ? data.data : data
  }
}
