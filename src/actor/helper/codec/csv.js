import csv from 'csv'
import isObject from 'lodash/isObject.js'
import { Codec } from './codec.js'

export class CsvCodec extends Codec {
  setType (value = 'text/csv') {
    return super.setType(value)
  }

  parse (buffer, options = {}, callback = () => {}) {
    if (isObject(csv) === false) {
      callback(null, buffer)
      return
    }

    csv.parse(buffer, options, callback)
  }

  stringify (array, options = {}, callback = () => {}) {
    if (isObject(csv) === false) {
      callback(null, String(array))
      return
    }

    csv.stringify(array, options, callback)
  }
}
