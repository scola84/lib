import isError from 'lodash/isError.js'
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
    const resolve = box[`resolve.${this._name}`]

    if (isFunction(resolve.callback) === true) {
      if (isError(data) === true) {
        resolve.callback(data)
      } else {
        resolve.callback(null, data)
      }
    }

    if (resolve.total > 0) {
      resolve.count += 1

      this.log('info', 'Resolving %d/%d', [resolve.count, resolve.total], box.rid)

      if (this._collect === true) {
        const index = Number.isInteger(data.index) === true
          ? data.index
          : resolve.collect.length

        resolve.collect[index] = data
      }

      if ((resolve.count % resolve.total) > 0) {
        return
      }
    }

    this.tearDownBoxResolve(box)

    this.pass(
      box,
      this._collect === true && resolve.total > 0
        ? resolve.collect
        : resolve.data
    )
  }

  decide (box) {
    return isPlainObject(box[`resolve.${this._name}`]) === true
  }

  err (box, error) {
    this.act(box, error)
  }

  tearDownBoxResolve (box) {
    delete box[`resolve.${this._name}`]
    return true
  }
}
