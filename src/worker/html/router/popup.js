import * as d3 from 'd3-selection'

export class Popup {
  constructor (options = {}) {
    this._router = null
    this.setRouter(options.router)
  }

  getRouter () {
    return this._router
  }

  setRouter (value = null) {
    this._router = value
    return this
  }

  close (box, data) {
    const base = d3.select(this._router.getBase())
    const parent = d3.select(this._router.getBase().parentNode)

    if (parent.classed('in') === false) {
      this._router.process(box, data)
      return
    }

    d3.select(document).on('keydown.scola-popup', null)
    d3.select('body').classed('popup', false)

    parent.style('width')

    parent
      .classed('in', false)
      .on('click.scola-popup', null)
      .on('transitionend.scola-popup', () => {
        parent
          .classed('open', false)
          .on('.scola-popup', null)

        this._router.process(box, data)
      })

    base.classed('move', box.options.imm === false)
    base.style('width')

    base
      .classed('in', false)
      .on('click.scola-popup', null)

    const duration = parseFloat(parent.style('transition-duration'))

    if (duration === 0) {
      parent.dispatch('transitionend')
    }
  }

  open (box, data) {
    const base = d3.select(this._router.getBase())
    const parent = d3.select(this._router.getBase().parentNode)

    if (parent.classed('in') === true) {
      return
    }

    d3.select(document).on('keydown.scola-popup', () => {
      if (d3.event.keyCode === 27) {
        parent.dispatch('click')
      }
    })

    d3.select('body').classed('popup', true)

    parent.classed('open', true)
    parent.style('width')

    parent
      .classed('in', true)
      .on('click.scola-popup', () => {
        if (box.options.lck === false) {
          box.path = null
          box.options.clr = true
          this._router.act(box, data)
        }
      })

    base.classed('move', box.options.imm === false)
    base.style('width')

    base
      .classed('in', true)
      .on('click.scola-popup', () => {
        d3.event.stopPropagation()
      })
  }
}
