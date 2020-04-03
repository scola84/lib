import buffr from 'buffer/index.js'
import isError from 'lodash/isError.js'
import isString from 'lodash/isString.js'
import typeParser from 'content-type'

export class Response {
  constructor (original) {
    this.original = original
  }

  getHeaders () {
    return this.original.getHeaders()
  }

  getHeader (name) {
    return this.original.getHeader(name)
  }

  setHeaders (headers) {
    const names = Object.keys(headers)
    let name = null

    for (let i = 0; i < names.length; i += 1) {
      name = names[i]
      this.setHeader(name, headers[name])
    }

    return this
  }

  setHeader (name, value) {
    this.original.setHeader(name, value)
    return this
  }

  getStatus () {
    return this.original.statusCode
  }

  setStatus (value) {
    this.original.statusCode = value
    return this
  }

  getType () {
    try {
      return typeParser.parse(this.getHeader('Content-Type')).type
    } catch (error) {
      return undefined
    }
  }

  send (body, end = true, callback = () => {}) {
    if (isString(this.getHeader('Content-Type')) === false) {
      this.setHeader('Content-Type', 'application/json')
    }

    const type = this.getType()
    const codec = this.parent.getCodec(type)

    this.parent.log('info', 'Encoding response as %o', [codec.getType()])

    codec.encode(this.original, body, (encoderError, buffer) => {
      if (isError(encoderError) === true) {
        callback(encoderError)
        return
      }

      if (this.original.headersSent === false) {
        if (this.getHeader('Content-Length') === null) {
          this.original.removeHeader('Content-Length')
        } else {
          this.setHeader('Content-Length', buffr.Buffer.byteLength(buffer))
        }

        this.parent.log('info', 'Writing response headers %o', [this.getHeaders()])
        this.original.writeHead(this.getStatus())
      }

      this.parent.log('info', 'Writing response body %o', [buffer])
      this.original.write(buffer, callback)

      if (end === true) {
        this.original.end()
      }
    })
  }
}
