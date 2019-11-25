import http from 'http'
import merge from 'lodash-es/merge'
import parse from 'url-parse'
import { HttpWorker } from './worker'

const wcodecs = HttpWorker.createCodecs()

const wmeta = {
  headers: {},
  statusCode: 200
}

export class HttpServer extends HttpWorker {
  static getMeta () {
    return wmeta
  }

  static setMeta (meta) {
    merge(wmeta, meta)
  }

  handleRequest (request, response) {
    const type = request.parseHeader('content-type')

    const decoder = wcodecs[type.value] === undefined
      ? wcodecs['application/octet-stream']
      : wcodecs[type.value]

    decoder.decode(request, (decoderError, requestData) => {
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

      if (request.getHeader('connection') === 'close') {
        request.socket.setTimeout(5000)
      } else {
        request.socket.setKeepAlive(true)
        request.socket.setTimeout(0)
      }

      this.pass(box, {}, request, requestData)
    })
  }

  handleResponse (request, response, value) {
    const cmeta = this.getConfig('http.server') || {}
    const responseMeta = merge({}, wmeta, cmeta, value.meta)
    const responseData = value.data

    response.statusCode = responseMeta.statusCode

    Object.keys(responseMeta.headers).forEach((name) => {
      response.setHeader(name, responseMeta.headers[name])
    })

    const type = response.parseHeader('content-type')

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

  merge (box, data, request, requestData) {
    if (requestData === undefined) {
      return {}
    }

    return requestData
  }

  patchRequest (request) {
    request.getHeader = (name) => request.headers[name]
    request.parseHeader = (name) => this.parseHeader(request.getHeader(name))
  }

  patchResponse (response) {
    response.parseHeader = (name) => this.parseHeader(response.getHeader(name))
  }

  start () {
    const server = http.createServer()

    server.on('request', (request, response) => {
      this.patchRequest(request)
      this.patchResponse(response)
      this.handleRequest(request, response)
    })

    server.keepAliveTimeout = 0
    server.listen(this.getConfig('http.server.listen'))
  }
}
