import { select, event } from 'd3-selection'
import fastclick from 'fastclick'

export function bind () {
  if (typeof window === 'undefined') {
    return
  }

  fastclick(document.body)

  // body.on('touchstart', () => {
  //   body.dispatch('click', event)
  // })

  const main = select('body>.app>.main')

  main.on('click.scola-bind route.scola-bind', () => {
    if (select(event.target).classed('show-menu') === true) {
      select('.app>.menu')
        .classed('transition', true)
        .classed('in', true)
        .on('touchstart.scola-menu', () => event.stopPropagation())
        .on('click.scola-menu', () => event.stopPropagation())
    } else {
      select('.app>.menu.in')
        .classed('transition', true)
        .classed('in', false)
        .on('touchstart.scola-menu', null)
        .on('click.scola-menu', null)
    }
  })
}
