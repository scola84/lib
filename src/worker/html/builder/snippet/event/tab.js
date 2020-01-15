import * as d3 from 'd3-selection'
import { Click } from './click.js'

export class Tab extends Click {
  handle (box, data, snippet, event) {
    const node = snippet.node()
    const children = Array.from(node.node().children)
    const tab = children.indexOf(event.target)

    if (tab === box.tab || tab < 0) {
      return
    }

    box.tab = tab

    d3.selectAll(children).classed('selected', false)
    d3.select(children[box.tab]).classed('selected', true)

    this.pass(box, data)
  }
}
