import { STATUS_CODES } from 'http'
import { Worker } from '../core'

export class HttpResponder extends Worker {
  act (box, boxData) {
    const {
      meta = {},
      data
    } = this.filter(box, boxData)

    if (box.request.method === 'GET' && data === undefined) {
      this.err(box, new Error('404 Resource not found'))
      return
    }

    meta.statusCode = box.request.method === 'POST'
      ? 201
      : 200

    box.callback({
      meta,
      data: {
        data,
        status: meta.statusCode
      }
    })
  }

  err (box, error) {
    const {
      meta = {}
    } = this.filter(box, error)

    const [,
      code = 500,
      text
    ] = error.message.match(/(\d{3})?([^(]*)/) || []

    meta.statusCode = Number(code)

    let { data } = error

    if (data === undefined) {
      if (meta.statusCode < 500 && text !== undefined) {
        data = text.trim()
      } else {
        data = STATUS_CODES[meta.statusCode]
      }
    }

    box.callback({
      meta,
      data: {
        data,
        status: meta.statusCode
      }
    })
  }

  filter (box, data) {
    if (this._filter !== null) {
      return this.filter(box, data)
    }

    return data
  }
}
