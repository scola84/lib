import { STATUS_CODES } from 'http'
import { Worker } from '../core'

export class HttpResponder extends Worker {
  act (box, data) {
    const {
      meta: responseMeta = {},
      data: responseData
    } = data

    if (box.request.method === 'GET' && responseData === undefined) {
      this.err(box, new Error('404 Resource not found'))
      return
    }

    responseMeta.statusCode = box.request.method === 'POST'
      ? 201
      : 200

    box.callback({
      meta: responseMeta,
      data: {
        data: responseData,
        status: responseMeta.statusCode
      }
    })
  }

  err (box, error) {
    const {
      meta: responseMeta = {}
    } = error

    const [,
      code = 500,
      text
    ] = error.message.match(/(\d{3})?([^(]*)/) || []

    responseMeta.statusCode = Number(code)

    let {
      data: responseData
    } = error

    if (responseData === undefined) {
      if (responseMeta.statusCode < 500 && text !== undefined) {
        responseData = text.trim()
      } else {
        responseData = STATUS_CODES[responseMeta.statusCode]
      }
    }

    box.callback({
      meta: responseMeta,
      data: {
        data: responseData,
        status: responseMeta.statusCode
      }
    })
  }
}
