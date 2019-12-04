import { event, select } from 'd3-selection'
import { Widget } from '../widget'

export class Alert extends Widget {
  constructor (options = {}) {
    super(options)

    this._message = null
    this._title = null

    this.setMessage(options.message)
    this.setTitle(options.title)
  }

  node () {
    return select('body')
  }

  getMessage () {
    return this._message
  }

  setMessage (value = null) {
    this._message = value
    return this
  }

  message (value) {
    return this.setMessage(value)
  }

  getTitle () {
    return this._title
  }

  setTitle (value = null) {
    this._title = value
    return this
  }

  title (value) {
    return this.setTitle(value)
  }

  build (hb) {
    return hb
      .modal()
      .class('transition')
      .append(
        hb.submit(
          hb.form()
            .class('dialog')
            .append(
              hb.header(
                hb.title()
                  .text(
                    this._title
                  )
              ),
              hb.body(
                hb.div()
                  .html(
                    this._message
                  )
              ),
              hb.footer(
                hb.click(
                  hb.button()
                    .text(
                      hb.print()
                        .format('button.ok')
                    )
                ).act(() => {
                  this.remove()
                })
              )
            )
        ).act((box, data) => {
          this.remove()
          this.pass(box, data)
        })
      )
  }

  removeBefore () {
    select(document).on('keydown.scola-prompt', null)

    const node = this._widget.node()

    node
      .classed('in', false)
      .on('transitionend.scola-prompt', () => {
        node.on('.scola-prompt', null)
        this.removeOuter()
      })

    const duration = parseFloat(node.style('transition-duration'))

    if (duration === 0) {
      node.dispatch('transitionend')
    }
  }

  resolveAfter () {
    select(document).on('keydown.scola-prompt', () => {
      if (event.keyCode === 27) {
        this.remove()
      }
    })

    this._widget.node().style('width')
    this._widget.node().classed('in', true)
  }
}
