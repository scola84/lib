import defaultsDeep from 'lodash/defaultsDeep.js'
import { Event } from '../event.js'

export class Scroll extends Event {
  constructor (options = {}) {
    super(options)

    this._height = null
    this.setHeight(options.height)

    this
      .name('scroll')
      .debounce(250)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      height: this._height
    }
  }

  getHeight () {
    return this._height
  }

  setHeight (value = 48) {
    this._height = value
    return this
  }

  height (value) {
    return this.setHeight(value)
  }

  handle (box, data, snippet) {
    if (box.list.total % box.list.count > 0) {
      return
    }

    const node = snippet.node().node()
    const top = box.list.height + node.scrollTop
    const threshold = node.scrollHeight - (box.list.height / 2)

    if (top < threshold) {
      return
    }

    box.list.append = true
    box.list.offset += box.list.count

    this.pass(box, data)
  }

  resolveBefore (box, data) {
    const height = parseFloat(this._parent.node().style('height'))
    const count = Math.round(height / this._height) * 2

    defaultsDeep(box, {
      list: {
        count,
        height,
        offset: 0,
        total: 0
      }
    })

    return this.resolveOuter(box, data)
  }
}
