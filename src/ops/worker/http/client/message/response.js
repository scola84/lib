import typeParser from 'content-type'

export class Response {
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

  getStatus () {
    return this.original.status
  }

  getType () {
    try {
      return typeParser.parse(this.getHeader('Content-Type')).type
    } catch (error) {
      return undefined
    }
  }

  decode (callback, progress) {
    const type = this.getType()
    const codec = this.parent.getCodec(type)

    this.parent.log('info', 'Decoding response as %o', [codec.getType()])

    codec.decode(this.original, callback, progress)
  }
}
