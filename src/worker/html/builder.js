import * as d3 from 'd3-selection'
import { Builder } from '../core/index.js'
import map from './builder/map/index.js'
import snippet from './builder/snippet/index.js'

export class HtmlBuilder extends Builder {
  static querySelector (...args) {
    return d3.select(...args)
  }

  constructor (options = {}) {
    super(options)

    this._view = null
    this.setView(options.view)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      view: this._view
    }
  }

  getNode () {
    return d3.select(this._upstream.getBase())
  }

  node () {
    return this.getNode()
  }

  getView () {
    return this._view
  }

  setView (value = null) {
    this._view = typeof value === 'function'
      ? value.call(this, this)
      : value

    if (this._view) {
      this._view.setParent(this)
    }

    return this
  }

  act (box, data) {
    if (this._view === null) {
      this._view = this.build(this)
    }

    this._view.resolve(box, data)
    this.pass(box, data)
  }

  build () {
    return this._view
  }

  querySelector (...args) {
    return d3.select(...args)
  }

  querySelectorAll (...args) {
    return d3.selectAll(...args)
  }
}

HtmlBuilder.snippet = snippet
HtmlBuilder.attachFactories(map)
