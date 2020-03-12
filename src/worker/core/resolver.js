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
    const resolve = box.resolve[this._name]

    if (typeof resolve.callback === 'function') {
      if (data instanceof Error) {
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
          : resolve.data.length

        resolve.data[index] = data
      }

      if ((resolve.count % resolve.total) > 0) {
        return
      }
    }

    this.pass(
      box,
      this._collect === true && resolve.total > 0 ? resolve.data : data
    )
  }

  decide (box) {
    return typeof box.resolve === 'object' &&
      typeof box.resolve[this._name] === 'object'
  }

  err (box, error) {
    this.act(box, error)
  }
}
