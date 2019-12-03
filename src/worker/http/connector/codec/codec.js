export class Codec {
  decode (readable, callback) {
    const buffers = []

    readable.on('data', (buffer) => {
      buffers.push(buffer)
    })

    readable.once('end', () => {
      const buffer = Buffer.concat(buffers)

      if (buffer.length === 0) {
        callback(null, buffer)
        return
      }

      const data = typeof TextDecoder === 'undefined'
        ? buffer
        : new TextDecoder().decode(buffer)

      try {
        callback(null, this.parse(data))
      } catch (error) {
        callback(error)
      }
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
