import isFunction from 'lodash/isFunction.js'
import isNil from 'lodash/isNil.js'
import { Snippet } from '../../../../helper/index.js'
import { Builder } from '../../../core/index.js'

export class HtmlSnippet extends Snippet {
  static attachFactories (objects) {
    Reflect.apply(Builder.attachFactories, this, [objects])
  }

  constructor (options = {}) {
    super(options)

    this._filter = null
    this.setFilter(options.filter)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      filter: this._filter
    }
  }

  getFilter () {
    return this._filter
  }

  setFilter (value = null) {
    this._filter = value
    return this
  }

  filter (value) {
    return this.setFilter(value)
  }

  remove () {
    this.removeBefore()
  }

  removeAfter () {}

  removeBefore () {
    this.removeOuter()
  }

  removeInner () {
    for (let i = 0; i < this._args.length; i += 1) {
      this._args[i].remove()
    }

    this.removeAfter()
  }

  removeOuter () {
    this.removeInner()
  }

  resolve (box, data) {
    let value = null

    if (this.hasPermission(box, data) === true) {
      value = this.resolveBefore(box, data)
    }

    return value
  }

  resolveAfter () {}

  resolveBefore (box, data) {
    return this.resolveOuter(box, data)
  }

  resolveInner (box, data) {
    for (let i = 0; i < this._args.length; i += 1) {
      this.resolveValue(box, data, this._args[i])
    }

    return this.resolveAfter(box, data)
  }

  resolveOuter (box, data) {
    return this.resolveInner(box, data)
  }

  resolveValue (box, data, value) {
    if (isNil(value) === true) {
      return null
    }

    if ((value instanceof HtmlSnippet) === true) {
      return this.resolveValue(box, data, value.resolve(box, data))
    }

    if (isFunction(value) === true) {
      return this.resolveValue(box, data, value(box, data))
    }

    return value
  }
}
