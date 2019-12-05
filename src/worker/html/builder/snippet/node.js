import { select } from 'd3-selection'
import { Snippet } from './snippet'
import { Dummy } from '../helper'

export class Node extends Snippet {
  constructor (options = {}) {
    super(options)

    this._name = null
    this._node = null
    this._transform = []

    this.setName(options.name)
    this.setNode(options.node)
    this.setTransform(options.transform)

    if (options.class !== undefined) {
      this.class(options.class)
    }
  }

  getOptions () {
    return {
      ...super.getOptions(),
      name: this._name,
      node: this._node,
      transform: this._transform
    }
  }

  setId (value) {
    if (typeof value === 'string') {
      return this.attributes({
        id: value
      })
    }

    return super.setId(value)
  }

  getName () {
    return this._name
  }

  setName (value = 'div') {
    this._name = value
    return this
  }

  name (value) {
    return this.setName(value)
  }

  setNode (value = null) {
    this._node = value
    return this
  }

  getNode () {
    return this._node
  }

  node () {
    return this.getNode()
  }

  getTransform () {
    return this._transform
  }

  setTransform (value = []) {
    this._transform = value
    return this
  }

  transform (...transform) {
    this._transform = this._transform.concat(transform)
    return this
  }

  attributes (values) {
    return this.transform((box, data, node) => {
      this.resolveEach(box, data, values, (key, value) => {
        node.attr(key, value)
      })
    })
  }

  classed (values) {
    return this.transform((box, data, node) => {
      this.resolveEach(box, data, values, (key, value) => {
        node.classed(key, value)
      })
    })
  }

  html (value) {
    return this.transform((box, data, node) => {
      node.html(this.resolveValue(box, data, value))
    })
  }

  properties (values) {
    return this.transform((box, data, node) => {
      this.resolveEach(box, data, values, (key, value) => {
        node.property(key, value)
      })
    })
  }

  styles (values) {
    return this.transform((box, data, node) => {
      this.resolveEach(box, data, values, (key, value) => {
        node.style(key, value)
      })
    })
  }

  text (value) {
    return this.transform((box, data, node) => {
      node.text(this.resolveValue(box, data, value))
    })
  }

  class (value) {
    return this.classed({
      [value]: true
    })
  }

  createNode () {
    const node = this._parent === null
      ? select('body').append(this._name).remove()
      : this._parent.node().append(this._name)

    node.node().snippet = this

    this.setNode(node)
  }

  removeNode () {
    if (this._node === null) {
      return
    }

    this._node.node().snippet = null
    this._node.remove()
    this._node = null
  }

  removeAfter () {
    this.removeNode()
  }

  resolve (box, data) {
    const hasPermission = this.hasPermission(box, data)

    if (hasPermission === false) {
      return null
    }

    if (this._node === null) {
      this.createNode()
    }

    return this.resolveBefore(box, data)
  }

  resolveAfter () {
    return this._node
  }

  resolveAttribute (box, data, name) {
    let node = this._node

    if (node === null) {
      node = new Dummy()
      this.resolveTransform(box, data, node)
    }

    return node.attr(name)
  }

  resolveEach (box, data, object, callback) {
    const resolvedObject = this.resolveValue(box, data, object)

    const keys = Object.keys(resolvedObject)
    let key = null

    for (let i = 0; i < keys.length; i += 1) {
      key = keys[i]
      callback(key, this.resolveValue(box, data, resolvedObject[key]))
    }
  }

  resolveOuter (box, data) {
    this.resolveTransform(box, data, this._node)
    return this.resolveInner(box, data)
  }

  resolveProperty (box, data, name) {
    let node = this._node

    if (node === null) {
      node = new Dummy()
      this.resolveTransform(box, data, node)
    }

    return node.property(name)
  }

  resolveTransform (box, data, node) {
    for (let i = 0; i < this._transform.length; i += 1) {
      this._transform[i](box, data, node)
    }
  }

  wrapNode (name) {
    const node = this._node.node()
    const wrapper = document.createElement(name)

    node.parentNode.insertBefore(wrapper, node)
    wrapper.appendChild(node)

    return select(wrapper)
  }
}
