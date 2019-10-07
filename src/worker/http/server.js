import http from 'http'
import merge from 'lodash-es/merge'
import parse from 'url-parse'
import { Worker } from '../core'
import * as codecs from '../../helper/codec'
import { parseHeader } from '../../helper/parse'

const wcodecs = Object.keys(codecs).reduce((object, name) => {
  return {
    ...object,
    [codecs[name].type()]: new codecs[name]()
  }
}, {})

const wmeta = {
  headers: {},
  statusCode: 200
}

export class HttpServer extends Worker {
  handleRequest (request, response) {
    const type = parseHeader(request.headers['content-type'])

    const decoder = wcodecs[type.value] === undefined
      ? wcodecs['application/octet-stream']
      : wcodecs[type.value]

    decoder.decode(request, (decoderError, decoderData) => {
      request.url = parse(request.url, true)

      const box = {
        request,
        response,
        callback: (value) => {
          this.handleResponse(request, response, value)
        }
      }

      if (decoderError !== null) {
        this.fail(box, decoderError)
        return
      }

      this.pass(box, this.merge(request, decoderData))
    })
  }

  handleResponse (request, response, value) {
    const cmeta = this._config.http === undefined
      ? {}
      : this._config.http.server

    const responseMeta = merge({}, wmeta, cmeta, value.meta)
    const responseData = value.data

    response.statusCode = responseMeta.statusCode

    Object.keys(responseMeta.headers).forEach((name) => {
      response.setHeader(name, responseMeta.headers[name])
    })

    const type = parseHeader(response.getHeader('content-type'))

    const encoder = wcodecs[type.value] === undefined
      ? wcodecs['application/octet-stream']
      : wcodecs[type.value]

    encoder.encode(response, responseData, (encoderError, encoderData) => {
      if (encoderError !== null) {
        this.fail({ request, response }, encoderError)
      }

      response.setHeader('Content-Length', Buffer.byteLength(encoderData))
      response.end(encoderData)
    })
  }

  merge (box, data, ...extra) {
    if (this._merge !== null) {
      return this._merge(box, data, ...extra)
    }

    return data === undefined ? {} : data
  }

  start () {
    const server = http.createServer()

    server.on('request', (request, response) => {
      this.handleRequest(request, response)
    })

    server.listen(this._config.http.server.listen)
  }
}
