import * as d3 from 'd3-selection'

export class Popup {
  constructor (options = {}) {
    this._pop = null
    this._router = null

    this.setPop(options.pop)
    this.setRouter(options.router)
  }

  getPop () {
    return this._pop
  }

  setPop (value = null) {
    this._pop = value
    return this
  }

  getRouter () {
    return this._router
  }

  setRouter (value = null) {
    this._router = value
    return this
  }

  close (box, data) {
    const popup = d3.select(this._router.getBase())
    const pop = d3.select(this._pop)

    if (pop.classed('in') === false) {
      this._router.process(box, data)
      return
    }

    d3.select(document).on('keydown.scola-popup', null)
    d3.select('body').classed('popup', false)

    pop.style('width')

    pop
      .classed('in', false)
      .on('click.scola-popup', null)
      .on('transitionend.scola-popup', () => {
        pop
          .classed('open', false)
          .on('.scola-popup', null)

        this._router.process(box, data)
      })

    popup.classed('move', box.options.imm === false)
    popup.style('width')

    popup
      .classed('in', false)
      .on('click.scola-popup', null)

    const duration = parseFloat(pop.style('transition-duration'))

    if (duration === 0) {
      pop.dispatch('transitionend')
    }
  }

  open (box, data) {
    const popup = d3.select(this._router.getBase())
    const pop = d3.select(this._pop)

    if (pop.classed('in') === true) {
      return
    }

    d3.select(document).on('keydown.scola-popup', () => {
      if (d3.event.keyCode === 27) {
        pop.dispatch('click')
      }
    })

    d3.select('body').classed('popup', true)

    pop.classed('open', true)
    pop.style('width')

    pop
      .classed('in', true)
      .on('click.scola-popup', () => {
        if (box.options.lck === false) {
          box.path = null
          box.options.clr = true
          this._router.act(box, data)
        }
      })

    popup.classed('move', box.options.imm === false)
    popup.style('width')

    popup
      .classed('in', true)
      .on('click.scola-popup', () => {
        d3.event.stopPropagation()
      })
  }
}
