import isError from 'lodash/isError.js'
import isNil from 'lodash/isNil.js'
import micromatch from 'micromatch'
import { Loader } from '../loader.js'

export class Logger extends Loader {
  constructor (options = {}) {
    super(options)

    this._client = null
    this._types = null

    this.setClient(options.client)
    this.setTypes(options.types)
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  getTypes () {
    return this._types
  }

  setTypes (value = '*:fail') {
    this._types = new Map()

    value.split(';').forEach((patternTypes) => {
      const [pattern, types] = patternTypes.split(':')

      types.split(',').forEach((type) => {
        this._types.set(type, (this._types.get(type) || []).concat(pattern))
      })
    })

    return this
  }

  check (id, type) {
    const patterns = this._types.get(type)

    if (isNil(patterns) === true) {
      return false
    }

    return micromatch.isMatch(id, patterns)
  }

  log (id, type, message, args = [], rid = 'log') {
    if (this.check(id, type) === false) {
      return
    }

    if (isError(args[0]) === true) {
      if (args[0].logged === true) {
        return
      }

      Object.defineProperty(args[0], 'logged', { value: true })
    }

    this.write(type, `${rid}:${id}`, message, args)
  }

  write () {}
}
