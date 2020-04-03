import { Input } from '../input.js'

const regexp = /^#[A-F0-9]{6}$/

export class Color extends Input {
  constructor (options) {
    super(options)

    this.attributes({
      type: 'color'
    })
  }

  cleanAfter (box, data, name, value) {
    this.setValue(data, name, String(value).trim().toUpperCase())
  }

  validateAfter (box, data, error, name, value) {
    if (regexp.test(value) === false) {
      return this.setError(error, name, value, 'type')
    }

    return null
  }
}
