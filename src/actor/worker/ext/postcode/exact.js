import isFinite from 'lodash/isFinite.js'
import isString from 'lodash/isString.js'
import { HttpClient } from '../../http/index.js'

export class PostcodeExactClient extends HttpClient {
  constructor (options = {}) {
    super(options)

    this._address = null
    this._url = null

    this.setAddress(options.address)
    this.setUrl(options.url)
  }

  getAddress () {
    return this._address
  }

  setAddress (value = null) {
    this._address = value
    return this
  }

  getUrl () {
    return this._url
  }

  setUrl (value = null) {
    this._url = value
    return this
  }

  address (box, data) {
    return data.address
  }

  build (box, data) {
    const {
      city,
      street,
      houseNumber,
      houseNumberAddition
    } = this.resolve('address', box, data)

    let url = this.resolve('url', box, data)

    if (isString(city) === true) {
      url += `/${city}`
    } else {
      throw new Error(`City "${city}" is not a string`)
    }

    if (isString(street) === true) {
      url += `/${street}`
    } else {
      throw new Error(`Street "${street}" is not a string`)
    }

    if (isFinite(houseNumber) === true) {
      url += `/${houseNumber}`
    } else {
      throw new Error(`House number "${houseNumber}" is not a finite`)
    }

    if (isString(houseNumberAddition) === true) {
      url += `/${houseNumberAddition}`
    }

    return {
      url
    }
  }

  transformError (error) {
    return super.transformError({
      ...error,
      message: error.exception
    })
  }

  url () {
    return 'https://api.postcode.eu/nl/v1/addresses/exact'
  }
}
