import { Input } from '../input'

export class Number extends Input {
  constructor (options) {
    super(options)

    this.attributes({
      type: 'number'
    })
  }

  validateAfter (box, data, error, name, value) {
    // https://stackoverflow.com/a/1830844
    if (Number.isNaN(value - parseFloat(value)) === true) {
      return this.setError(error, name, value, 'type')
    }

    this.setValue(data, name, parseFloat(value))
    return null
  }
}
