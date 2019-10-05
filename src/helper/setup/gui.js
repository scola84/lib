import { select, event } from 'd3-selection'
import fastclick from 'fastclick'
import { HtmlBuilder } from '../../worker'

export function gui () {
  if (typeof window === 'undefined') {
    return
  }

  const body = select('body')

  fastclick(body.node())

  body.on('touchstart', () => {
    body.dispatch('click', event)
  })

  body.on('click.scola-menu', () => {
    if (select(event.target).classed('show-menu') === true) {
      select('.app > .menu')
        .classed('transition', true)
        .classed('in', true)
        .on('touchstart.scola-menu', () => event.stopPropagation())
        .on('click.scola-menu', () => event.stopPropagation())
    } else {
      select('.app > .menu.in')
        .classed('transition', true)
        .classed('in', false)
        .on('touchstart.scola-menu', null)
        .on('click.scola-menu', null)
    }
  })

  HtmlBuilder.setup()
  HtmlBuilder.snippet.graph.Axis.setup()
  HtmlBuilder.snippet.graph.Plot.setup()
}
