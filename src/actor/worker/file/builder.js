import isError from 'lodash/isError.js'
import { Builder } from '../core/index.js'
import map from './builder/map/type.js'

export class FileBuilder extends Builder {
  constructor (options = {}) {
    super(options)

    this._file = null
    this._type = null

    this.setFile(options.file)
    this.setType(options.type)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      file: this._file,
      type: this._type
    }
  }

  getFile () {
    return this._file
  }

  setFile (value = null) {
    this._file = value
    return this
  }

  getType () {
    return this._type
  }

  setType (value = null) {
    this._type = value
    return this
  }

  act (box, data) {
    const file = this.resolveFile(box, data)
    const type = this.resolveType(box, data)

    type.transformFile(file, (error, result) => {
      if (isError(error) === true) {
        this.fail(box, error)
        return
      }

      this.pass(box, data, result)
    })
  }

  file (box, data) {
    return {
      ...data
    }
  }

  type () {
    return 'octetStream'
  }

  resolveFile (box, data) {
    return this.resolve('file', box, data)
  }

  resolveType (box, data) {
    return this[this.resolve('type', box, data)]()
  }
}

FileBuilder.attachFactories({ map })
