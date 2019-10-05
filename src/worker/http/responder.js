import { Worker } from '../core'
import { STATUS_CODES } from 'http'

export class HttpResponder extends Worker {
  act (box, boxData) {
    const {
      meta = {},
      data
    } = this.filter(box, boxData)

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
    ] = error.message.match(/^(\d{3})\s?(.*)/) || []

    if (code) {
      meta.statusCode = Number(code)
    }

    const data = error.data
      ? error.data
      : meta.statusCode < 500 && text
        ? text
        : STATUS_CODES[meta.statusCode]

    box.callback({
      meta,
      data: {
        data,
        status: meta.statusCode
      }
    })
  }

  filter (box, data) {
    if (this._filter) {
      return this.filter(box, data)
    }

    return data
  }
}
