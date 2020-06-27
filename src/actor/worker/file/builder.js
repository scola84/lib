import camelCase from 'lodash/camelCase.js'
import isError from 'lodash/isError.js'
import isNil from 'lodash/isNil.js'
import typeParser from 'content-type'
import { Builder } from '../core/index.js'
import { map as typeMap } from './builder/type/index.js'

export class FileBuilder extends Builder {
  constructor (options = {}) {
    super(options)

    this._build = null
    this._type = null

    this.setBuild(options.build)
    this.setType(options.type)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      build: this._build,
      type: this._type
    }
  }

  getBuild () {
    return this._build
  }

  setBuild (value = null) {
    this._build = value
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
    const file = this.resolve('build', box, data)
    const type = this.resolveType(box, data, file)

    if (isNil(type) === true) {
      this.pass(box, data)
      return
    }

    type.transformFile(file, (error, result) => {
      if (isError(error) === true) {
        this.fail(box, data, error)
        return
      }

      this.pass(box, data, result)
    })
  }

  build (box, data) {
    return {
      ...data
    }
  }

  type (box, data, file) {
    const {
      type = 'application/octet-stream'
    } = isNil(file.type) === true
      ? {}
      : typeParser.parse(file.type)

    return camelCase(type.split('/').pop())
  }

  resolveType (box, data, file) {
    const type = this.resolve('type', box, data, [file])

    if (isNil(this[type]) === true) {
      return null
    }

    return this[type]()
  }
}

FileBuilder.attachFactories({ typeMap })
