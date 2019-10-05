import Resizer from 'element-resize-detector'
import debounce from 'lodash-es/debounce'
import { Event } from '../event'

export class Resize extends Event {
  bind (box, data, snippet) {
    const node = this
      .resolveValue(box, data, snippet)
      .node()

    const resizer = Resizer({
      callOnAdd: false
    })

    const debouncer = debounce(() => {
      this.handleBefore(box, data, snippet)
    }, 100)

    let height = node.offsetHeight
    let width = node.offsetWidth

    resizer.listenTo(node, () => {
      if (node.offsetHeight !== height || node.offsetWidth !== width) {
        debouncer()
      }

      height = node.offsetHeight
      width = node.offsetWidth
    })

    node.resizer = resizer
  }

  unbind (snippet) {
    const node = snippet.node().node()
    node.resizer.uninstall(node)
  }
}
