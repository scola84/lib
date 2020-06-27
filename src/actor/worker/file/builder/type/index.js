import camelCase from 'lodash/camelCase.js'
import { Csv } from './csv.js'
import { OctetStream } from './octet-stream.js'
import { Pdf } from './pdf.js'

const type = {
  Csv,
  OctetStream,
  Pdf
}

export const map = Object
  .keys(type)
  .reduce((object, name) => {
    return {
      ...object,
      [camelCase(name)]: {
        object: type[name]
      }
    }
  }, {})

export default type
