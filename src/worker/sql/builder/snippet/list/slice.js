import { Snippet } from '../snippet'

export class Slice extends Snippet {
  constructor (options = {}) {
    super(options)

    this._count = null
    this._max = null
    this._offset = null

    this.setCount(options.count)
    this.setMax(options.max)
    this.setOffset(options.offset)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      count: this._count,
      max: this._max,
      offset: this._offset
    })
  }

  getCount () {
    return this._count
  }

  setCount (value = 10) {
    this._count = value
    return this
  }

  count (value) {
    return this.setCount(value)
  }

  getMax () {
    return this._max
  }

  setMax (value = 100) {
    this._max = value
    return this
  }

  max (value) {
    return this.setMax(value)
  }

  getOffset () {
    return this._offset
  }

  setOffset (value = 0) {
    this._offset = value
    return this
  }

  offset (value) {
    return this.setOffset(value)
  }

  resolveInner (box, data) {
    const count = parseFloat(
      this.resolveValue(box, data, this._count) || 10
    )

    const offset = parseFloat(
      this.resolveValue(box, data, this._offset) || 0
    )

    if (
      Number.isInteger(count) === false ||
      Number.isInteger(offset) === false ||
      count > this._max
    ) {
      throw new Error('400 Slice parameters are invalid')
    }

    return this.resolveParens(
      `${count} OFFSET ${offset}`,
      this._parens
    )
  }
}
