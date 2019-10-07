import IBAN from 'iban'
import { Input } from '../input'

export class Iban extends Input {
  constructor (options) {
    super(options)

    this.attributes({
      type: 'text'
    })
  }

  cleanAfter (box, data, name, value) {
    this.setValue(data, name, String(value).replace(/\s+/g, ''))
  }

  validateAfter (box, data, error, name, value) {
    const country = value
      .toUpperCase()
      .slice(0, 2)

    const specification = IBAN.countries[country]

    if (specification === undefined) {
      return this.setError(error, name, value, 'type')
    }

    const slicedValue = value.slice(0, specification.length)

    if (IBAN.isValid(slicedValue) === false) {
      return this.setError(error, name, slicedValue, 'type')
    }

    this.setValue(data, name, IBAN.electronicFormat(slicedValue))
    return null
  }
}
