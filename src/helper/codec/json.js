const type = 'application/json'

class Codec {
  static decode (readable, callback) {
    const buffers = []

    readable.on('data', (buffer) => {
      buffers.push(buffer)
    })

    readable.once('end', () => {
      const buffer = Buffer.concat(buffers)

      if (buffer.length === 0) {
        callback()
        return
      }

      const string = typeof TextDecoder === 'undefined'
        ? String(buffer)
        : new TextDecoder().decode(buffer)

      try {
        callback(null, JSON.parse(string))
      } catch (error) {
        callback(error)
      }
    })
  }

  static encode (writable, data, callback) {
    try {
      if (data === null || data === undefined) {
        writable.end(callback)
      } else {
        data = JSON.stringify(data)
        writable.setHeader('Content-Length', Buffer.byteLength(data))
        writable.end(data, callback)
      }
    } catch (error) {
      callback(error)
    }
  }
}

export {
  Codec,
  type
}
