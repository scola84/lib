import isError from 'lodash/isError.js'
import isObject from 'lodash/isObject.js'
import { Loader } from '../../../../helper/index.js'
import { Builder } from '../../../core/index.js'

export class Client extends Loader {
  static attachFactories (objects) {
    Reflect.apply(Builder.attachFactories, this, [objects])
  }

  constructor (options = {}) {
    super(options)

    this._origin = null
    this._pool = null

    this.setOrigin(options.origin)
    this.setPool(options.pool)
  }

  getOrigin () {
    return this._origin
  }

  setOrigin (value = null) {
    this._origin = value
    return this
  }

  getPool () {
    return this._pool
  }

  setPool (value = null) {
    this._pool = value
    return this
  }

  executeQuery (box, data, options, callback) {
    if (options.result === 'stream') {
      this.streamQuery(box, data, options, callback)
      return
    }

    this.returnQuery(box, data, options, callback)
  }

  returnQuery (box, data, options, callback) {
    this.connectPool(box, (connectError, connection) => {
      if (isError(connectError) === true) {
        callback(connectError)
        return
      }

      connection.query(options.string, (queryError, result) => {
        this.disconnectPool(box, connection, options.persist)
        callback(queryError, this.normalizeResult(result))
      })
    })
  }

  setUpBoxResolve (box, data, options) {
    if (options.resolve === false) {
      return true
    }

    if (isObject(box[`resolve.${options.name}`]) === true) {
      return false
    }

    box[`resolve.${options.name}`] = {
      data,
      collect: [],
      count: 0,
      total: 0
    }

    return true
  }

  setUpBoxThrottle (box, stream, options) {
    if (options.throttle === false) {
      return true
    }

    if (isObject(box[`throttle.${options.name}`]) === true) {
      return false
    }

    box[`throttle.${options.name}`] = {
      pause: () => {
        stream.pause()
      },
      resume: () => {
        stream.resume()
      }
    }

    return true
  }

  streamQuery (box, data, options, callback) {
    this.connectPool(box, (connectError, connection) => {
      if (isError(connectError) === true) {
        callback(connectError)
        return
      }

      const stream = this.createStream(connection, options)

      if (this.setUpBoxResolve(box, data, options) === false) {
        this.disconnectPool(box, connection, options.persist)
        callback(new Error(`Could not set up resolve for '${options.name}'`))
        return
      }

      if (this.setUpBoxThrottle(box, stream, options) === false) {
        this.disconnectPool(box, connection, options.persist)
        callback(new Error(`Could not set up throttle for '${options.name}'`))
        return
      }

      this.streamQueryEvents(stream, (streamError, result = {}) => {
        this.updateBoxResolve(box, options, result)

        if (result.last === false) {
          callback(streamError, result)
          return
        }

        this.disconnectPool(box, connection, options.persist)
        this.tearDownBoxThrottle(box, options)

        callback(streamError, result)
      })
    })
  }

  streamQueryEvents (stream, callback) {
    let first = true
    let next = null
    let total = 0

    stream.once('end', () => {
      callback(null, { first, total, last: true, row: next })
      stream.removeAllListeners()
    })

    stream.once('error', (error) => {
      callback(error, { first, total, last: true, row: error })
      stream.removeAllListeners()
    })

    stream.on('data', (row) => {
      if (next !== null) {
        callback(null, { first, total, last: false, row: next })
        first = false
      }

      next = { ...row }
      total += 1
    })
  }

  tearDownBoxThrottle (box, options) {
    if (options.throttle === false) {
      return
    }

    delete box[`throttle.${options.name}`]
  }

  updateBoxResolve (box, options, result) {
    if (options.resolve === false) {
      return
    }

    box[`resolve.${options.name}`].total = result.total

    if (result.last === false) {
      box[`resolve.${options.name}`].total += 1
    }
  }

  createStream () {}

  normalizeResult () {}
}
