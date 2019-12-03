import { Worker } from '../core'
import { codec } from './connector/codec'

export class HttpConnector extends Worker {
  constructor (options = {}) {
    super(options)

    this._codecs = null
    this.setCodecs(options.codecs)
  }

  getCodecs () {
    return this._codecs
  }

  getCodec (type) {
    return this._codecs[type] === undefined
      ? this._codecs['application/octet-stream']
      : this._codecs[type]
  }

  setCodecs (value = codec) {
    this._codecs = value
    return this
  }

  parseHeader (header = '') {
    const result = {}

    let char = null
    let i = 0
    let key = 'value'
    let value = ''

    for (; i <= header.length; i += 1) {
      char = header[i]

      if (char === ',' || i === header.length) {
        result[key] = value
        key = null
        value = ''
      } else if (char === ';') {
        result[key] = value
        key = ''
        value = ''
      } else if (char === '=') {
        key = value
        value = ''
      } else if (char === '"') {
        continue
      } else if (char === ' ' && value === '') {
        continue
      } else {
        value += char
      }
    }

    return result
  }
}

HttpConnector.codec = codec
