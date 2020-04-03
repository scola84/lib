import fs from 'fs-extra'
import isNil from 'lodash/isNil.js'
import isString from 'lodash/isString.js'
import typeParser from 'content-type'
import { Loader } from '../../../../helper/index.js'

export class Type extends Loader {
  constructor (options = {}) {
    super(options)

    this._origin = null
    this.setOrigin(options.origin)
  }

  getOrigin () {
    return this._origin
  }

  setOrigin (value = null) {
    this._origin = value
    return this
  }

  setModules (value = { fs }) {
    return super.setModules(value)
  }

  readFile (file, callback) {
    if (isString(file.content) === true) {
      callback(null, file.content)
      return
    }

    if (isString(file.path) === false) {
      callback(null, '')
      return
    }

    const {
      parameters: {
        charset = null
      }
    } = isNil(file.type) === true
      ? {}
      : typeParser.parse(file.type)

    this
      .getModule('fs')
      .readFile(file.path, charset, callback)
  }

  transformFile () {}
}
