import crypto from 'crypto'
import http from 'http'
import isError from 'lodash/isError.js'
import isObject from 'lodash/isObject.js'
import { Worker } from '../core/index.js'
import { Request, Response } from './server/message/index.js'

export class HttpServer extends Worker {
  constructor (options = {}) {
    super(options)

    this._boxes = null
    this._server = null
    this._throttle = null

    this.setBoxes(options.boxes)
    this.setServer(options.server)
    this.setThrottle(options.throttle)
  }

  getBoxes () {
    return this._boxes
  }

  setBoxes (value = new Map()) {
    this._boxes = value
    return this
  }

  setModules (value = { crypto, http, Request, Response }) {
    return super.setModules(value)
  }

  getServer () {
    return this._server
  }

  setServer (value = null) {
    if (this._server !== null) {
      this.log('info', 'Setting server to %o', [value])
      this._server.close()
    }

    if (value === null) {
      this._server = null
      return this
    }

    const server = this._modules.http.createServer()

    server.on('request', (request, response) => {
      this.handleRequest(
        new this._modules.Request(request),
        new this._modules.Response(response)
      )
    })

    server.keepAliveTimeout = 0
    server.setServerValue = value
    server.listen(value)

    this._server = server
    return this
  }

  getThrottle () {
    return this._throttle
  }

  setThrottle (value = false) {
    this._throttle = value
    return this
  }

  createBoxServer (request) {
    return {
      bid: this._modules.crypto.randomBytes(32).toString('hex'),
      rid: request.getHeader('x-request-id'),
      sid: request.getCookie('stream-id'),
      origin: this
    }
  }

  handleRequest (request, response) {
    const box = this.createBoxServer(request)

    this.prepareBoxServer(box, request, response)

    if (this._throttle === true) {
      this.prepareBoxThrottle(box, this._server.setServerValue)
    }

    this._boxes.set(box.bid, box)

    response.original.once('error', (error) => {
      this.log('fail', '', [error], box.rid)
    })

    response.original.socket.once('close', () => {
      response.original.removeAllListeners()
      this._boxes.delete(box.bid)
    })

    if (request.getHeader('connection') === 'close') {
      request.original.socket.setTimeout(5000)
    } else {
      request.original.socket.setKeepAlive(true)
      request.original.socket.setTimeout(0)
    }

    this.log('info', 'Handling request %o %o %o', [
      request.getMethod(),
      request.original.url,
      request.getHeaders()
    ], box.rid)

    request.parent = this
    response.parent = this

    request.decode((decoderError, decoderData) => {
      if (isError(decoderError) === true) {
        this.fail(box, decoderError)
        return
      }

      this.pass(box, decoderData)
    })
  }

  prepareBoxServer (box, request, response) {
    if (isObject(box[`server.${this._name}`]) === true) {
      throw new Error(`Server for '${this._name}' is defined`)
    }

    box[`server.${this._name}`] = {
      request,
      response
    }

    return box
  }

  prepareBoxThrottle (box, setServerValue) {
    if (isObject(box[`throttle.${this._name}`]) === true) {
      throw new Error(`Throttle for '${this._name}' is defined`)
    }

    box[`throttle.${this._name}`] = {
      pause: () => {
        this.setServer(null)
      },
      resume: () => {
        this.setServer(setServerValue)
      }
    }

    return box
  }
}
