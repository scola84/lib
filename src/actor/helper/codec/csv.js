import csv from 'csv/lib/sync.js'
import { Codec } from './codec.js'

export class CsvCodec extends Codec {
  setType (value = 'text/csv') {
    return super.setType(value)
  }

  parse (data, options) {
    return csv.parse(data, options)
  }

  stringify (data, options) {
    return csv.stringify(data, options)
  }
}
