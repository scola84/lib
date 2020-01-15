import typeParser from 'content-type'
import fetch from 'node-fetch'
import { Response } from './response.js'

export class Request {
  constructor (original) {
    this.original = original
  }

  getHeaders () {
    return this.original.headers
  }

  getHeader (name) {
    if (this.original.headers.has(name) === true) {
      return this.original.headers.get(name)
    }

    if (this.original.headers.has(name.toLowerCase()) === true) {
      return this.original.headers.get(name.toLowerCase())
    }

    return undefined
  }

  setHeader (name, value) {
    this.original.headers.set(name, value)
    return this
  }

  getMethod () {
    return this.original.method
  }

  getType () {
    try {
      return typeParser.parse(this.getHeader('Content-Type')).type
    } catch (error) {
      return undefined
    }
  }

  getUrl () {
    return this.original.url
  }

  send (body, callback) {
    if (typeof this.getHeader('Content-Type') !== 'string') {
      this.setHeader('Content-Type', 'application/json')
    }

    const type = this.getType()
    const codec = this.parent.getCodec(type)

    this.parent.log('info', 'Encoding request as "%s"', [codec.getType()])

    codec.encode(this.original, body, (encoderError, encoderData) => {
      if (encoderError !== null) {
        callback(encoderError)
        return
      }

      this.parent.log('info', 'Writing request headers %j', [this.original.headers])
      this.parent.log('info', 'Writing request body %s', [encoderData])

      fetch(this.original, {
        body: encoderData
      }).then((response) => {
        callback(null, new Response(response))
      }).catch((error) => {
        callback(error)
      })
    })
  }
}
