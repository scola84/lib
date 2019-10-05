import { Worker } from './worker'

export class Resolver extends Worker {
  constructor (options = {}) {
    super(options)

    this._collect = null
    this.setCollect(options.collect)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      collect: this._collect
    })
  }

  getCollect () {
    return this._collect
  }

  setCollect (value = false) {
    this._collect = value
    return this
  }

  act (box, data) {
    this.resolve(box, data, (...args) => {
      this.pass(...args)
    })
  }

  decide (box, data) {
    if (this._decide) {
      return this._decide(box, data)
    }

    return box.resolve !== undefined
  }

  err (box, error) {
    this.resolve(box, error, (...args) => {
      this.fail(...args)
    })
  }

  resolve (box, data, callback) {
    const resolve = box.resolve[this._name]

    if (resolve.callback) {
      resolve.callback()
    }

    if (this._collect === true) {
      resolve.data = resolve.data || []

      if (resolve.empty === false) {
        const index = data.index === undefined
          ? resolve.data.length
          : data.index

        resolve.data[index] = data
      }
    }

    resolve.count += 1

    const next = resolve.empty === true ||
      resolve.count % resolve.total === 0

    if (next === true) {
      if (this._collect === true) {
        data = resolve.data
      }

      if (this._wrap === true) {
        box = box.box
      }

      callback(box, data)
    }
  }
}
