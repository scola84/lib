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
      data: responseData
    })

    this.pass(box, data)
  }

  err (box, error) {
    const {
      meta: responseMeta = {}
    } = error

    const match = error.message.match(/(\d{3})?[^[]*(\[(.+)\])?/)

    const [,
      code = 500, ,
      status
    ] = match || []

    responseMeta.statusCode = Number(code)

    let {
      data: responseData
    } = error

    if (responseData === undefined) {
      responseData = {
        status,
        message: STATUS_CODES[responseMeta.statusCode]
      }
    }

    box.callback({
      meta: responseMeta,
      data: responseData
    })

    this.fail(box, error)
  }
}
