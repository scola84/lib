import http from 'http'
import { randomBytes } from 'crypto'
import { Worker } from '../core/index.js'
import { Request, Response } from './server/message/index.js'

export class HttpServer extends Worker {
  constructor (options = {}) {
    super(options)

    this._boxes = null
    this._server = null

    this.setBoxes(options.boxes)
    this.setServer(options.server)
  }

  getBoxes () {
    return this._boxes
  }

  setBoxes (value = new Map()) {
    this._boxes = value
    return this
  }

  getServer () {
    return this._server
  }

  setServer (value = null) {
    if (this._server !== null) {
      this.log('info', 'Changing server to "%s"', [value])
      this._server.close()
    }

    if (value === null) {
      this._server = null
      return this
    }

    const server = http.createServer()

    server.on('request', (request, response) => {
      this.handleRequest(new Request(request), new Response(response))
    })

    server.keepAliveTimeout = 0
    server.listen(value)

    this._server = server
    return this
  }

  handleRequest (request, response) {
    const bid = randomBytes(32).toString('hex')
    const rid = request.getHeader('x-request-id')
    const sid = request.getCookie('stream-id')

    const box = this.prepareBox(bid, rid, sid, request, response)
    this._boxes.set(bid, box)

    response.original.once('error', (error) => {
      this.log('fail', '', [error], box.rid)
    })

    response.original.socket.once('close', () => {
      response.original.removeAllListeners()
      this._boxes.delete(bid)
    })

    if (request.getHeader('connection') === 'close') {
      request.original.socket.setTimeout(5000)
    } else {
      request.original.socket.setKeepAlive(true)
      request.original.socket.setTimeout(0)
    }

    this.log('info', 'Handling request "%s %s" %j', [
      request.getMethod(),
      request.original.url,
      request.getHeaders()
    ], rid)

    request.parent = this
    response.parent = this

    request.decode((decoderError, decoderData) => {
      if (decoderError !== null) {
        this.fail(box, decoderError)
        return
      }

      this.pass(box, decoderData)
    })
  }

  prepareBox (bid, rid, sid, request, response) {
    return {
      bid,
      rid,
      sid,
      origin: this,
      server: {
        [this._name]: {
          request,
          response
        }
      }
    }
  }
}
