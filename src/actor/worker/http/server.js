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
    this._identifiers = null
    this._server = null
    this._throttle = null

    this.setBoxes(options.boxes)
    this.setIdentifiers(options.identifiers)
    this.setServer(options.server)
    this.setThrottle(options.throttle)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      boxes: this._boxes,
      identifiers: this._identifiers,
      server: this._server,
      throttle: this._throttle
    }
  }

  getBoxes () {
    return this._boxes
  }

  setBoxes (value = new Map()) {
    this._boxes = value
    return this
  }

  getIdentifiers () {
    return this._identifiers
  }

  setIdentifiers (value = 'rid,sid') {
    this._identifiers = new Set(value.split(','))
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

    const server = this
      .getModule('http')
      .createServer()

    server.on('request', (request, response) => {
      this.handleRequest(
        this.newModule('Request', request),
        this.newModule('Response', response)
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
    const box = {
      bid: this
        .getModule('crypto')
        .randomBytes(32)
        .toString('hex'),
      origin: this
    }

    if (this._identifiers.has('rid') === true) {
      box.rid = request.getHeader('x-request-id')
    }

    if (this._identifiers.has('sid') === true) {
      box.sid = request.getCookie('stream-id')
    }

    return box
  }

  handleRequest (request, response) {
    const box = this.createBoxServer(request)

    if (this.setUpBoxServer(box, request, response) === false) {
      this.fail(box, null, new Error(`Could not set up server for '${this._name}'`))
      return
    }

    if (this.setUpBoxThrottle(box, this._server.setServerValue) === false) {
      this.fail(box, null, new Error(`Could not set up throttle for '${this._name}'`))
      return
    }

    this._boxes.set(box.bid, box)

    response.original.once('error', (error) => {
      this.log('fail', '', [error], box.rid)
    })

    response.original.socket.once('close', () => {
      response.original.removeAllListeners()
      delete box[`server.${this._name}`]
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

    request.decode((decodeError, object) => {
      if (isError(decodeError) === true) {
        this.fail(box, object, decodeError)
        return
      }

      this.pass(box, object)
    })
  }

  setUpBoxServer (box, request, response) {
    if (isObject(box[`server.${this._name}`]) === true) {
      return false
    }

    box[`server.${this._name}`] = {
      request,
      response
    }

    return true
  }

  setUpBoxThrottle (box, setServerValue) {
    if (this._throttle === false) {
      return true
    }

    if (isObject(box[`throttle.${this._name}`]) === true) {
      return false
    }

    box[`throttle.${this._name}`] = {
      pause: () => {
        this.setServer(null)
      },
      resume: () => {
        this.setServer(setServerValue)
      }
    }

    return true
  }
}
