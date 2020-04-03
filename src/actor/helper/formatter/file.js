import fs from 'fs-extra'
import isNil from 'lodash/isNil.js'
import { Formatter } from './formatter.js'

export class FileFormatter extends Formatter {
  constructor (options = {}) {
    super(options)

    this._files = null
    this.setFiles(options.files)
  }

  getFiles () {
    return this._files
  }

  setFiles (value = new Map()) {
    this._files = value
    return this
  }

  setModules (value = { fs }) {
    return super.setModules(value)
  }

  format (value, options) {
    const {
      def = '',
      from = 'utf-8',
      path = value,
      to = 'utf-8'
    } = options

    if (isNil(path) === true) {
      return def
    }

    const key = `${path}:${from}:${to}`

    if (this._files.has(key) === true) {
      return this._files.get(key)
    }

    const content = this
      .getModule('fs')
      .readFileSync(path, { encoding: from })
      .toString(to)

    this._files.set(key, content)
    return content
  }
}
