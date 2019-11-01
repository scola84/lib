import { Worker } from '../core'
import * as codec from './worker/helper/codec'

export class HttpWorker extends Worker {
  static createCodecs () {
    return Object.keys(codec).reduce((object, name) => {
      return {
        ...object,
        [codec[name].type()]: new codec[name]()
      }
    }, {})
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

HttpWorker.codec = codec
