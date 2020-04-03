import isArray from 'lodash/isArray.js'
import isError from 'lodash/isError.js'
import isFunction from 'lodash/isFunction.js'
import isNil from 'lodash/isNil.js'
import isObject from 'lodash/isObject.js'
import buffr from 'buffer/index.js'
import { Loader } from '../loader.js'

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

    let buffer = buffr.Buffer.concat(buffers)

    if (typeof TextDecoder !== 'undefined') {
      buffer = new TextDecoder().decode(buffer)
    }

    this.parse(buffer, {}, (error, object) => {
      if (isError(error) === true) {
        callback(new Error(`400 ${error.message}`))
        return
      }

      callback(null, object)
    })
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
      progress(buffr.Buffer.byteLength(chunk))
      this.decodeReader(reader, callback, progress)
    })
  }

  decodeStream (readable, callback, progress) {
    const buffers = []

    readable.on('data', (chunk) => {
      buffers.push(chunk)
      progress(buffr.Buffer.byteLength(chunk))
    })

    readable.once('end', () => {
      this.decodeEnd(buffers, callback)
    })
  }

  encode (writable, object, callback) {
    if (isNil(object) === true) {
      callback(null, object)
      return
    }

    this.stringify(object, {}, callback)
  }

  parse (buffer, options, callback) {
    callback(null, buffer)
  }

  stringify (object, options, callback) {
    callback(null, String(object))
  }
}
