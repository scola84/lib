import isNil from 'lodash/isNil.js'
import matcher from 'matcher'
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

  setTypes (value = '*:error') {
    this._types = new Map()

    value.split(',').forEach((patternTypes) => {
      const [pattern, types] = patternTypes.split(':')

      types.split(';').forEach((type) => {
        this._types.set(type, [...(this._types.get(type) || []), pattern])
      })
    })

    return this
  }

  log (id, type, message, args = [], rid = 'log') {
    let mustLog = this.mustLog(id, type)

    if (type === 'fail') {
      if (this.mustLog(id, 'error') === true) {
        if (args[0].logged !== true) {
          Object.defineProperty(args[0], 'logged', { value: true })
          mustLog = true
        } else {
          args[0] = ''
        }
      } else {
        args[0] = ''
      }
    }

    if (mustLog === true) {
      this.write(type, `${rid}:${id}`, message, args)
    }
  }

  mustLog (id, type) {
    const patterns = this._types.get(type)

    if (isNil(patterns) === true) {
      return false
    }

    for (let i = 0; i < patterns.length; i += 1) {
      if (matcher.isMatch(id, patterns[i]) === true) {
        return true
      }
    }

    return false
  }

  write () {}
}
