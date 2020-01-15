import buffer from 'buffer/index.js'

export class Codec {
  constructor (options = {}) {
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
    if (typeof readable.body === 'object') {
      this.decodeReader(readable.body.getReader(), callback, progress)
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

    data = typeof TextDecoder === 'object'
      ? new TextDecoder().decode(data)
      : data

    try {
      callback(null, this.parse(data))
    } catch (error) {
      callback(error)
    }
  }

  decodeReader (reader, callback, progress) {
    if (Array.isArray(reader.buffers) === false) {
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
    if (data === null || data === undefined) {
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
