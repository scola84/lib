import * as d3 from 'd3-selection'
import { Builder } from '../core/index.js'
import snippet from './builder/tool/snippet/index.js'
import toolMap from './builder/tool/index.js'

export class HtmlBuilder extends Builder {
  static querySelector (...args) {
    return d3.select(...args)
  }

  constructor (options = {}) {
    super(options)

    this._build = null
    this._view = null

    this.setBuild(options.build)
    this.setView(options.view)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      build: this._build,
      view: this._view
    }
  }

  getBuild () {
    return this._build
  }

  setBuild (value = null) {
    this._build = value
    return this
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
    this._view = value
    return this
  }

  act (box, data) {
    this
      .resolveView()
      .resolve(box, data)

    this.pass(box, data)
  }

  build () {
    return this.div()
  }

  querySelector (...args) {
    return d3.select(...args)
  }

  querySelectorAll (...args) {
    return d3.selectAll(...args)
  }

  resolveView () {
    if (this._view === null) {
      this._view = this
        .resolve('build', this)
        .setParent(this)
    }

    return this._view
  }
}

HtmlBuilder.snippet = snippet
HtmlBuilder.attachFactories(toolMap)
