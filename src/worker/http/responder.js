import { Worker } from '../core/index.js'

export class HttpResponder extends Worker {
  act (box, data) {
    const { request, response } = box.server[this._name]
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
    return typeof box.server === 'object' &&
      typeof box.server[this._name] === 'object'
  }

  err (box, error) {
    const { response } = box.server[this._name]
    const match = error.message.match(/^(\d{3})/)
    const [, code = '500'] = match || []

    response.setStatus(code)
    response.send(error)

    this.fail(box, error)
  }

  filter (box, data) {
    return {
      body: data
    }
  }
}
