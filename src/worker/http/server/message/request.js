import cookieParser from 'cookie'
import isString from 'lodash/isString.js'
import typeParser from 'content-type'
import urlParser from 'url-parse'

export class Request {
  constructor (original) {
    this.original = original
  }

  getCookie (name) {
    try {
      return cookieParser.parse(this.getHeader('Cookie'))[name]
    } catch (error) {
      return undefined
    }
  }

  getHeaders () {
    return this.original.headers
  }

  getHeader (name) {
    return isString(this.original.headers[name]) === true
      ? this.original.headers[name]
      : this.original.headers[name.toLowerCase()]
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
    return urlParser(this.original.url, true)
  }

  decode (callback, progress) {
    const type = this.getType()
    const codec = this.parent.getCodec(type)

    this.parent.log('info', 'Decoding request as %o', [codec.getType()])

    codec.decode(this.original, callback, progress)
  }
}
