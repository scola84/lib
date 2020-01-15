import * as d3 from 'd3-selection'
// import fastclick from 'fastclick'

export function bind () {
  if (typeof window === 'undefined') {
    return
  }

  // fastclick(document.body)

  // body.on('touchstart', () => {
  //   body.dispatch('click', event)
  // })

  const main = d3.select('body>.app>.main')

  main.on('click.scola-bind route.scola-bind', () => {
    if (d3.select(d3.event.target).classed('show-menu') === true) {
      d3.select('.app>.menu')
        .classed('transition', true)
        .classed('in', true)
        .on('touchstart.scola-menu', () => d3.event.stopPropagation())
        .on('click.scola-menu', () => d3.event.stopPropagation())
    } else {
      d3.select('.app>.menu.in')
        .classed('transition', true)
        .classed('in', false)
        .on('touchstart.scola-menu', null)
        .on('click.scola-menu', null)
    }
  })
}
