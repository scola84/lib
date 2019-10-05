import { select } from 'd3-selection'
import { Builder } from '../core'
import { map, snippet } from './builder/'

export class HtmlBuilder extends Builder {
  static setup () {
    HtmlBuilder.attachFactories(HtmlBuilder, map)
  }

  constructor (options = {}) {
    super(options)

    this._view = null
    this.setView(options.view)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      view: this._view
    })
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
    this._view = value
    return this
  }

  act (box, data) {
    this._view.resolve(
      box,
      this.filter(box, data)
    )

    this.pass(box, data)
  }

  build (view) {
    return this.setView(
      view.setParent(this)
    )
  }
}

HtmlBuilder.snippet = snippet
