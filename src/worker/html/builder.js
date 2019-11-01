import { select, selectAll } from 'd3-selection'
import { Builder } from '../core'
import { bind, map, snippet } from './builder/'

export class HtmlBuilder extends Builder {
  static setup () {
    HtmlBuilder.attachFactories(HtmlBuilder, map)
    snippet.graph.Axis.setup()
    snippet.graph.Plot.setup()
    bind()
  }

  static querySelector (...args) {
    return select(...args)
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
    return select(this._upstream.getBase())
  }

  node () {
    return this.getNode()
  }

  getView () {
    return this._view
  }

  setView (value = null) {
    this._view = typeof value === 'function'
      ? value(this)
      : value

    if (this._view) {
      this._view.setParent(this)
    }

    return this
  }

  act (box, data) {
    if (this._view === null) {
      this.createView()
    }

    this._view.resolve(box, data)
    this.pass(box, data)
  }

  build () {
    return this._view
  }

  createView () {
    this.setView(this.build(this))
  }

  querySelector (...args) {
    return select(...args)
  }

  querySelectorAll (...args) {
    return selectAll(...args)
  }
}

HtmlBuilder.snippet = snippet
