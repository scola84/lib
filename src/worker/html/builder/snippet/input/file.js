import { Input } from '../input.js'

export class File extends Input {
  constructor (options) {
    super(options)

    this.attributes({
      type: 'file'
    })
  }

  isAcceptable (value, accept) {
    if (accept === null || accept === undefined) {
      return true
    }

    const list = accept.split(',')
    const [fileType, fileSubType] = value.type.split('/')

    let type = null
    let subtype = null

    for (let i = 0; i < list.length; i += 1) {
      [type, subtype] = list[i].split('/')

      if (type !== '*' && fileType !== type) {
        return false
      }

      if (subtype !== '*' && fileSubType !== subtype) {
        return false
      }
    }

    return true
  }

  validateAfter (box, data, error, name, value) {
    return this.validateAccept(box, data, error, name, value)
  }

  validateAccept (box, data, error, name, value) {
    const accept = this.resolveAttribute(box, data, 'accept')

    if (this.isAcceptable(value, accept) === false) {
      return this.setError(error, name, value, 'accept', { accept })
    }

    return this.validateMaxsize(box, data, error, name, value)
  }

  validateMaxsize (box, data, error, name, value) {
    const maxsize = this.resolveAttribute(box, data, 'maxsize')

    if (this.isBelowMax(value.size, maxsize) === false) {
      return this.setError(error, name, value, 'maxsize', { maxsize })
    }

    return null
  }
}
