import isError from 'lodash/isError.js'
import isFinite from 'lodash/isFinite.js'
import isFunction from 'lodash/isFunction.js'
import isPlainObject from 'lodash/isPlainObject.js'
import { Worker } from './worker.js'

export class Resolver extends Worker {
  constructor (options = {}) {
    super(options)

    this._collect = null
    this.setCollect(options.collect)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      collect: this._collect
    }
  }

  getCollect () {
    return this._collect
  }

  setCollect (value = false) {
    this._collect = value
    return this
  }

  act (box, data) {
    this.execute(box, data, null, (error, resolve) => {
      if (isError(error) === true) {
        this.fail(box, data, error)
        return
      }

      if (this._collect === true && resolve.total > 0) {
        this.pass(box, resolve.collect)
      } else {
        this.pass(box, resolve.data)
      }
    })
  }

  decide (box) {
    return isPlainObject(box[`resolve.${this._name}`]) === true
  }

  err (box, data, error) {
    this.execute(box, data, error, () => {
      this.fail(box, data, error)
    })
  }

  execute (box, data, error, callback) {
    const resolve = box[`resolve.${this._name}`]

    if (isFunction(resolve.callback) === true) {
      if (this.resolveCallback(box, data, error, resolve)) {
        callback(null, resolve)
      }
    } else if (isFinite(resolve.total) === true) {
      if (resolve.total === 0) {
        if (this.resolveEmpty(box) === true) {
          callback(null, resolve)
        }
      } else if (this.resolveTotal(box, data, resolve) === true) {
        callback(null, resolve)
      }
    }
  }

  resolveCallback (box, data, error, resolve) {
    this.tearDownBoxResolve(box)

    this.log('info', 'Resolving callback', [], box.rid)

    if (isError(error) === true) {
      resolve.callback(error)
    } else {
      resolve.callback(null, data)
    }

    return true
  }

  resolveEmpty (box) {
    this.log('info', 'Resolving empty', [], box.rid)
    this.tearDownBoxResolve(box)
    return true
  }

  resolveTotal (box, data, resolve) {
    resolve.count += 1

    this.log('info', 'Resolving %d/%d', [resolve.count, resolve.total], box.rid)

    if (this._collect === true) {
      const index = Number.isInteger(data.index) === true
        ? data.index
        : resolve.collect.length

      resolve.collect[index] = data
    }

    if ((resolve.count % resolve.total) > 0) {
      return false
    }

    this.tearDownBoxResolve(box)
    return true
  }

  tearDownBoxResolve (box) {
    delete box[`resolve.${this._name}`]
  }
}
