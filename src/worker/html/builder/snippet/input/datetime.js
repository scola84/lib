import { DateTime as Luxon } from 'luxon'
import { Input } from '../input'

export class DateTime extends Input {
  constructor (options = {}) {
    super(options)

    this._formatFrom = null
    this._formatTo = null

    this.setFormatFrom(options.formatFrom)
    this.setFormatTo(options.formatTo)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      formatFrom: this._formatFrom,
      formatTo: this._formatTo
    })
  }

  getFormatFrom () {
    return this._formatFrom
  }

  setFormatFrom (value = null) {
    this._formatFrom = value
    return this
  }

  formatFrom (value) {
    return this.setFormatFrom(value)
  }

  getFormatTo () {
    return this._formatTo
  }

  setFormatTo (value = null) {
    this._formatTo = value
    return this
  }

  formatTo (value) {
    return this.setFormatTo(value)
  }

  cleanAfter (box, data, name, value) {
    this.setValue(data, name, String(value).trim())
  }

  validateAfter (box, data, error, name, value) {
    const formatFrom = this.resolveValue(box, data, this._formatFrom)
    const date = Luxon.fromFormat(value, formatFrom)

    if (date.isValid === false) {
      return this.setError(error, name, value, 'type')
    }

    return null
  }
}
