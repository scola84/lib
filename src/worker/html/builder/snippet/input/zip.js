import postalcodes from 'postal-codes-js'
import { Input } from '../input'

export class Zip extends Input {
  constructor (options = {}) {
    super(options)

    this._country = null
    this.setCountry(options.country)

    this.attributes({
      type: 'zip'
    })
  }

  getOptions () {
    return {
      ...super.getOptions(),
      country: this._country
    }
  }

  getCountry () {
    return this._country
  }

  setCountry (value = 'NL') {
    this._country = value
    return this
  }

  country (value) {
    return this.setCountry(value)
  }

  cleanAfter (box, data, name, value) {
    this.setValue(data, name, String(value).replace(/[-\s]+/g, ''))
  }

  validateAfter (box, data, error, name, value) {
    const country = this.resolveValue(box, data, this._country)

    if (postalcodes.validate(country, value) !== true) {
      return this.setError(error, name, value, 'type')
    }

    return null
  }
}
