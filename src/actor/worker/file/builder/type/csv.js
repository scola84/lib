import isError from 'lodash/isError.js'
import { Type } from './type.js'

export class Csv extends Type {
  transformFile (file, callback) {
    this.readFile(file, (readError, buffer) => {
      if (isError(readError) === true) {
        callback(readError)
      }

      const codec = this._origin.getCodec('text/csv')

      codec.parse(buffer, {}, (parseError, array) => {
        if (isError(parseError) === true) {
          callback(parseError)
          return
        }

        codec.stringify(this.formatFile(array, file), file.options, callback)
      })
    })
  }

  formatFile (array, file) {
    return array.concat(file.data.list).map((line) => {
      return Object.keys(line).reduce((result, key) => {
        return {
          ...result,
          [key]: this._origin.format(String(line[key]), [file])
        }
      }, {})
    })
  }
}
