import { HtmlRouter } from '../../../../router.js'
import { Action } from '../action.js'

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

  setView (...value) {
    this._view = value
    return this
  }

  view (...value) {
    return this.setView(...value)
  }

  resolveAfter (box, data) {
    let [
      route,
      routeData = data
    ] = this.resolveValue(box, data, this._view)

    route = this._origin.format(this.expand(route), [
      box.params,
      routeData
    ])

    route = HtmlRouter.parseRoute(route, box.name)

    HtmlRouter.call(route, routeData)
  }
}
