import isError from 'lodash/isError.js'
import parallel from 'async/parallel.js'
import series from 'async/series.js'
import { Action } from '../action.js'

export class Async extends Action {
  constructor (options = {}) {
    super(options)

    this._handler = null
    this.setHandler(options.handler)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      handler: this._handler
    }
  }

  getHandler () {
    return this._handler
  }

  setHandler (value = parallel) {
    this._handler = value
    return this
  }

  parallel () {
    return this.setHandler(parallel)
  }

  series () {
    return this.setHandler(series)
  }

  asyncify (box, data, snippet) {
    return (callback) => {
      snippet.act((bx, result) => {
        callback(null, result)
      })

      snippet.err((bx, error) => {
        callback(error)
      })

      this.resolveValue(box, data, snippet)
    }
  }

  resolveAfter (box, data) {
    const fn = []

    for (let i = 0; i < this._args.length; i += 1) {
      fn.push(this.asyncify(box, data, this._args[i]))
    }

    this._handler(fn, (error, results) => {
      if (isError(error) === true) {
        this.fail(box, error)
      } else {
        this.pass(box, fn.length === 1 ? results[0] : results)
      }
    })
  }
}
