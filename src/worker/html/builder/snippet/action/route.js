import { vsprintf } from '../../../../../helper'
import { HtmlRouter } from '../../../router'
import { Action } from '../action'

export class Route extends Action {
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

  getView () {
    return this._view
  }

  setView (value = null) {
    this._view = value
    return this
  }

  view (value) {
    return this.setView(value)
  }

  resolveAfter (box, data) {
    let route = this.resolveValue(box, data, this._view)

    route = vsprintf(this.expand(route), [
      box.params,
      data
    ])

    HtmlRouter.handle(route, {})
  }
}
