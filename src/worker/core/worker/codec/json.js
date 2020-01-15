import http from 'http'
import { Codec } from './codec.js'

export class JsonCodec extends Codec {
  setType (value = 'application/json') {
    return super.setType(value)
  }

  parse (data) {
    return JSON.parse(String(data), (key, value) => {
      return key === 'error' && value !== null
        ? this.parseError(value)
        : value
    })
  }

  parseError (value) {
    const error = new Error(
      (typeof value.code === 'string' ? `${value.code} ` : '') +
      (typeof value.type === 'string' ? `[${value.type}] ` : '') +
      value.message
    )

    error.code = value.code
    error.data = value.data
    error.type = value.type

    return error
  }

  stringify (data) {
    return JSON.stringify(data, (key, value) => {
      return value instanceof Error ? this.stringifyError(value) : value
    })
  }

  stringifyError (value) {
    const match = value.message.match(/(\d{3})?([^[]*(\[(.+)\]))?\s?(.*)/)

    const [, code = '500', , , type, message] = match || []

    return {
      code,
      type,
      data: value.data,
      message: code === '500' ? http.STATUS_CODES[code] : message
    }
  }
}
