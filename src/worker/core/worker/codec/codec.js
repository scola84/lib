import isArray from 'lodash/isArray.js'
import isFunction from 'lodash/isFunction.js'
import isNil from 'lodash/isNil.js'
import isObject from 'lodash/isObject.js'
import isUndefined from 'lodash/isUndefined.js'
import buffer from 'buffer/index.js'
import { Loader } from '../../../../helper/index.js'

export class Codec extends Loader {
  constructor (options = {}) {
    super(options)

    this._type = null
    this.setType(options.type)
  }

  getType () {
    return this._type
  }

  setType (value = null) {
    this._type = value
    return this
  }

  decode (readable, callback = () => {}, progress = () => {}) {
    if (isObject(readable.body) === true) {
      if (isFunction(readable.body.getReader) === true) {
        this.decodeReader(readable.body.getReader(), callback, progress)
      } else {
        this.decodeStream(readable.body, callback, progress)
      }
    } else {
      this.decodeStream(readable, callback, progress)
    }
  }

  decodeEnd (buffers, callback) {
    if (buffers.length === 0) {
      callback(null, null)
      return
    }

    let data = buffer.Buffer.concat(buffers)

    data = typeof TextDecoder === 'undefined'
      ? data
      : new TextDecoder().decode(data)

    try {
      callback(null, this.parse(data))
    } catch (error) {
      callback(error)
    }
  }

  decodeReader (reader, callback, progress) {
    if (isArray(reader.buffers) === false) {
      reader.buffers = []
    }

    reader.read().then(({ done, value: chunk }) => {
      if (done === true) {
        this.decodeEnd(reader.buffers, callback)
        return
      }

      reader.buffers.push(chunk)
      progress(buffer.Buffer.byteLength(chunk))
      this.decodeReader(reader, callback, progress)
    })
  }

  decodeStream (readable, callback, progress) {
    const buffers = []

    readable.on('data', (chunk) => {
      buffers.push(chunk)
      progress(buffer.Buffer.byteLength(chunk))
    })

    readable.once('end', () => {
      this.decodeEnd(buffers, callback)
    })
  }

  encode (writable, data, callback) {
    if (isNil(data) === true) {
      callback(null, data)
      return
    }

    try {
      callback(null, this.stringify(data))
    } catch (error) {
      callback(error)
    }
  }

  parse (string) {
    return string
  }

  stringify (data) {
    return data
  }
}
