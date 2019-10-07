import { select, selectAll } from 'd3-selection'
import { Node } from './node'

export class Parent extends Node {
  constructor (options = {}) {
    super(options)

    this._children = null
    this._key = null

    this.setChildren(options.children)
    this.setKey(options.key)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      children: this._children,
      key: this._key
    }
  }

  getChildren () {
    return this._children
  }

  setChildren (value = new Map()) {
    this._children = value
    return this
  }

  children (value) {
    return this.setChildren(value)
  }

  getKey () {
    return this._key
  }

  setKey (value = null) {
    this._key = value
    return this
  }

  key (value) {
    return this.setKey(value)
  }

  appendChild (box, data, snippet = null) {
    if (snippet === null) {
      return null
    }

    let key = this._key === null
      ? JSON.stringify(data)
      : this._key(box, data)

    key = key || snippet.getId()

    if (this._children.has(key) === true) {
      return this._children
        .get(key)
        .resolve(box, data)
    }

    const clone = snippet.clone()

    let node = clone.resolve(box, data)
    node = Array.isArray(node) === true ? node[0] : node

    if (node === null) {
      return null
    }

    this._children.set(key, clone)

    const transition = select(node.node().parentNode)
      .classed('transition')

    node.classed('transition', transition)
    node.style('width')
    node.classed('in', true)

    return node
  }

  removeChildren () {
    let children = Array.from(this._node.node().childNodes)

    if (children.length === 0) {
      return
    }

    children = selectAll(children)
      .classed('out', true)
      .on('transitionend.scola-parent', (datum, index, nodes) => {
        select(nodes[index]).on('.scola-parent', null)
        nodes[index].snippet.remove()
      })

    const duration = parseFloat(children.style('transition-duration'))

    if (duration === 0) {
      children.dispatch('transitionend')
    }

    this._children.clear()
  }
}
