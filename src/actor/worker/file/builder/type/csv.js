import isArray from 'lodash/isArray.js'
import isError from 'lodash/isError.js'
import merge from 'lodash/merge.js'
import orderBy from 'lodash/orderBy.js'
import { Type } from './type.js'

export class Csv extends Type {
  extractColumns (array, options) {
    let columns = null

    for (let i = 0; i < array.length; i += 1) {
      columns = Object.keys(array[i])

      if (columns.length > options.columns.length) {
        options.columns = columns
      }
    }
  }

  formatArray (array, file) {
    const formattedArray = merge([], array)

    let formattedItem = null
    let keys = null
    let key = null
    let unformattedItem = null

    for (let i = 0; i < file.data.list.length; i += 1) {
      unformattedItem = file.data.list[i]
      keys = Object.keys(unformattedItem)
      formattedItem = {}

      for (let j = 0; j < keys.length; j += 1) {
        key = keys[j]
        formattedItem[key] = this._origin.format(unformattedItem[key], [file], file.locale)
      }

      formattedArray.push(formattedItem)
    }

    return formattedArray
  }

  orderArray (array, options) {
    return orderBy(array, ...options.order)
  }

  transformFile (file, callback) {
    this.readFile(file, (readError, readBuffer) => {
      if (isError(readError) === true) {
        callback(readError)
        return
      }

      const codec = this._origin.getCodec('text/csv')
      const options = merge({ eof: false }, file.options)

      codec.parse(readBuffer, options, (parseError, parseArray) => {
        if (isError(parseError) === true) {
          callback(parseError)
          return
        }

        let array = this.formatArray(parseArray, file)

        if (isArray(options.order) === true) {
          array = this.orderArray(array, options)
        }

        if (isArray(options.columns) === true) {
          this.extractColumns(array, options)
        }

        codec.stringify(array, options, (stringifyError, stringifyBuffer) => {
          if (isError(stringifyError) === true) {
            callback(stringifyError)
            return
          }

          if (stringifyBuffer.length === 0) {
            callback(null, null)
            return
          }

          callback(null, stringifyBuffer)
        })
      })
    })
  }
}
