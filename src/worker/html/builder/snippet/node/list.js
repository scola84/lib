import { Parent } from '../parent'

export class List extends Parent {
  constructor (options = {}) {
    super(options)

    this._empty = null
    this.setEmpty(options.empty)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      empty: this._empty
    })
  }

  getEmpty () {
    return this._empty
  }

  setEmpty (value = null) {
    if (value) {
      this._empty = value
        .setParent(this)
        .class('empty')
    }

    return this
  }

  empty (value) {
    return this.setEmpty(value)
  }

  clearList (box) {
    const options = box.list || {}

    options.offset = 0
    options.total = 0

    this.removeChildren()
  }

  prepareList (box, data) {
    const options = box.list || {}

    if (options.append !== true) {
      this.clearList(box)
    }

    if (options.offset === 0 && options.count > 0) {
      this._node.node().parentNode.scrollTop = 0
    }

    options.total += data.length

    this.removeEmpty()
  }

  removeEmpty () {
    const empty = this._node.select('.empty').node()

    if (empty) {
      empty.snippet.remove()
    }
  }

  removeInner () {
    this.removeChildren()
    this.removeAfter()
  }

  resolveInner (box, data) {
    data = this._filter ? this._filter(box, data) : data
    data = Array.isArray(data) ? data : []

    const [
      item,
      ...extra
    ] = this._args

    this.prepareList(box, data)

    for (let i = 0; i < data.length; i += 1) {
      this.appendChild(box, data[i], item)
    }

    const size = this._node
      .select('.item:not(.out)')
      .size()

    if (data.length === 0 && size === 0) {
      this.appendChild(box, data, this._empty)
    }

    for (let i = 0; i < extra.length; i += 1) {
      this.appendChild(box, data, extra[i])
    }

    return this.resolveAfter(box, data)
  }
}
