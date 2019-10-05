import { Click } from './click'

export class Toggle extends Click {
  handle (box, data, snippet) {
    const node = snippet.node()
    box.toggle = !node.classed('toggled')

    node.classed('toggled', box.toggle)
    this.pass(box, data)
  }
}
