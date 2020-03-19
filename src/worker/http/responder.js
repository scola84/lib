import http from 'http'
import isPlainObject from 'lodash/isPlainObject.js'
import { Worker } from '../core/index.js'

export class HttpResponder extends Worker {
  act (box, data) {
    const { request, response } = box[`server.${this._name}`]
    const { body = null, end = true, headers = {} } = data

    if (request.getMethod() === 'GET' && body === null) {
      this.err(box, new Error(`404 [responder] Resource '${request.original.url}' is not found`))
      return
    }

    if (request.getMethod() === 'POST') {
      response.setStatus(201)
    }

    if (response.original.headersSent === false) {
      Object.keys(headers).forEach((name) => {
        response.setHeader(name, headers[name])
      })
    }

    response.send(body, end)

    this.pass(box, data)
  }

  decide (box) {
    return isPlainObject(box[`server.${this._name}`]) === true
  }

  err (box, error) {
    const { response } = box[`server.${this._name}`]
    const newError = this.error(error, http.STATUS_CODES)

    response
      .setStatus(newError.code)
      .send(newError)

    this.fail(box, error)
  }

  filter (box, data) {
    return {
      body: data
    }
  }
}
