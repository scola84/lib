import { Worker } from './worker'

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
    this.resolve(box, data, (newBox, newData) => {
      this.pass(newBox, newData)
    })
  }

  decide (box, data) {
    if (this._decide !== null) {
      return this._decide(box, data)
    }

    return box.resolve !== undefined
  }

  err (box, error) {
    this.resolve(box, error, (newBox) => {
      this.fail(newBox, error)
    })
  }

  resolve (box, data, callback) {
    const resolve = box.resolve[this._name]

    if (resolve.callback !== undefined) {
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
      (resolve.count % resolve.total) === 0

    if (next === true) {
      callback(
        this._wrap === true ? box.box : box,
        this._collect === true ? resolve.data : data
      )
    }
  }
}
