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

    if (this._collect === true) {
      if (resolve.empty === false) {
        const index = Number.isInteger(data.index) === true
          ? data.index
          : resolve.data.length

        resolve.data[index] = data
      }
    }

    if (resolve.empty === false) {
      resolve.count += 1
      this.log('info', 'Resolving "%s/%s"', [resolve.count, resolve.total], box.rid)
    }

    if (resolve.empty === true || (resolve.count % resolve.total) === 0) {
      const newBox = this._wrap === true
        ? box.box
        : box

      const newData = this._collect === true && resolve.empty === false
        ? resolve.data
        : data

      this.pass(newBox, newData)
    }
  }

  decide (box) {
    return typeof box.resolve === 'object' &&
      typeof box.resolve[this._name] === 'object'
  }

  err (box, error) {
    this.act(box, error)
  }
}
