import typeParser from 'content-type'
import isError from 'lodash/isError.js'
import isString from 'lodash/isString.js'
import fetch from 'node-fetch'
import { Loader } from '../../../../helper/index.js'
import { Response } from './response.js'

export class Request extends Loader {
  constructor (original) {
    super()
    this.original = original
  }

  setModules (value = { fetch, Response }) {
    return super.setModules(value)
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
    if (this.getMethod() !== 'GET') {
      if (isString(this.getHeader('Content-Type')) === false) {
        this.setHeader('Content-Type', 'application/json')
      }
    }

    const type = this.getType()
    const codec = this.parent.getCodec(type)

    this.parent.log('info', 'Encoding request as %o', [codec.getType()])

    codec.encode(this.original, body, (encoderError, buffer) => {
      if (isError(encoderError) === true) {
        callback(encoderError)
        return
      }

      this.parent.log('info', 'Writing request headers %o', [this.original.headers])
      this.parent.log('info', 'Writing request body %o', [buffer])

      this.getModule('fetch')(this.original, {
        body: buffer
      }).then((response) => {
        callback(null, this.newModule('Response', response))
      }).catch((error) => {
        callback(error)
      })
    })
  }
}
