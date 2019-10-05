import parallel from 'async/parallel'
import series from 'async/series'
import { Action } from '../action'

export class Async extends Action {
  constructor (options = {}) {
    super(options)

    this._handler = null
    this.setHandler(options.handler)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      handler: this._handler
    })
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
      snippet.act((b, result) => {
        callback(null, result)
      })

      snippet.err((b, error) => {
        callback(error)
      })

      this.resolveValue(box, data, snippet)
    }
  }

  resolveAfter (box, data) {
    const fn = []

    for (let i = 0; i < this._args.length; i += 1) {
      fn[fn.length] = this.asyncify(box, data, this._args[i])
    }

    this._handler(fn, (error, results) => {
      if (error) {
        this.fail(box, error)
      } else {
        results = fn.length === 1 ? results[0] : results
        this.pass(box, results)
      }
    })
  }
}
