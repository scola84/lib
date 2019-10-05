import parseContentType from 'content-type-parser'
import http from 'http'
import merge from 'lodash-es/merge'
import parse from 'url-parse'
import { Worker } from '../../worker'
import { codec } from '../../helper'

const wmeta = {
  headers: {},
  statusCode: 200
}

export class HttpServer extends Worker {
  static getMeta () {
    return wmeta
  }

  static setMeta (meta) {
    merge(wmeta, meta)
  }

  constructor (options = {}) {
    super(options)

    this._listen = null
    this.setListen(options.listen)
  }

  getListen () {
    return this._listen
  }

  setListen (value = 3000) {
    this._listen = value
    return this
  }

  handleRequest (request, response) {
    request.url = parse(request.url, true)

    const type = parseContentType(request.headers['content-type'])

    const decoder =
      (type && codec[`${type.type}/${type.subtype}`]) ||
      codec['application/octet-stream']

    decoder.decode(request, (decodeError, data) => {
      const callback = (value) => {
        this.handleResponse(request, response, value)
      }

      const box = {
        callback,
        request,
        response
      }

      if (decodeError) {
        this.fail(box, decodeError)
        return
      }

      this.pass(box, this.merge(request, data))
    })
  }

  handleResponse (request, response, { meta, data }) {
    meta = merge({}, wmeta, meta)

    response.statusCode = meta.statusCode

    Object.keys(meta.headers).forEach((name) => {
      response.setHeader(name, meta.headers[name])
    })

    const type = parseContentType(response.getHeader('content-type'))

    const encoder =
      (type && codec[`${type.type}/${type.subtype}`]) ||
      codec['application/octet-stream']

    encoder.encode(response, data, (encodeError) => {
      if (encodeError) {
        this.fail({ request, response }, encodeError)
      }
    })
  }

  start () {
    const server = http.createServer()

    server.on('request', (request, response) => {
      this.handleRequest(request, response)
    })

    server.listen(this._listen)
  }
}
