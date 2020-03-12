import * as d3 from 'd3-selection'

export class Menu {
  constructor (options = {}) {
    this._main = null
    this._router = null

    this.setMain(options.main)
    this.setRouter(options.router)

    this.start()
  }

  getMain () {
    return this._main
  }

  setMain (value = null) {
    this._main = value
    return this
  }

  getRouter () {
    return this._router
  }

  setRouter (value = null) {
    this._router = value
    return this
  }

  start () {
    const main = d3.select(this._main)
    const menu = d3.select(this._router.getBase())

    main.on('touchstart.scola-menu route.scola-menu', () => {
      if (d3.select(d3.event.target).classed('show-menu') === true) {
        menu
          .classed('transition', true)
          .classed('in', true)
          .on('touchstart.scola-menu', () => d3.event.stopPropagation())
      } else {
        menu
          .classed('transition', true)
          .classed('in', false)
          .on('touchstart.scola-menu', null)
      }
    })
  }
}
