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
    const isNumber = !isNaN(value - parseFloat(value))

    if (isNumber === false) {
      return this.setError(error, name, value, 'type')
    }

    this.setValue(data, name, parseFloat(value))

    return null
  }
}
