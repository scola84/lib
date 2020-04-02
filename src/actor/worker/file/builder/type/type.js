import fs from 'fs-extra'
import isString from 'lodash/isString.js'
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

  readFile ({ content, path }, callback) {
    if (isString(content) === true) {
      callback(null, content)
      return
    }

    this
      .getModule('fs')
      .readFile(path, callback)
  }
}
