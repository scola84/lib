import sprintf from 'sprintf-js'
import { HtmlRouter } from '../../../../html'
import { Action } from '../action'

export class Route extends Action {
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

    route = sprintf.sprintf(
      this.expand(route),
      Object.assign({}, box.params, data)
    )

    HtmlRouter.handle(box, {}, route)
  }
}
