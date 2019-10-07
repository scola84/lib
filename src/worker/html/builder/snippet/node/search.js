import defaults from 'lodash-es/defaultsDeep'
import { Node } from '../node'

export class Search extends Node {
  constructor (options = {}) {
    super(options)

    this._placeholder = null
    this._wildcard = null

    this.setPlaceholder(options.placeholder)
    this.setWildcard(options.wildcard)

    this.class('transition')
  }

  getOptions () {
    return {
      ...super.getOptions(),
      placeholder: this._placeholder,
      wildcard: this._wildcard
    }
  }

  getPlaceholder () {
    return this._placeholder
  }

  setPlaceholder (value = null) {
    this._placeholder = value
    return this
  }

  placeholder (value) {
    return this.setPlaceholder(value)
  }

  getWildcard () {
    return this._wildcard
  }

  setWildcard (value = '*') {
    this._wildcard = value
    return this
  }

  wildcard (value) {
    return this.setWildcard(value)
  }

  createNode () {
    super.createNode()

    const placeholder = this.resolveValue(null, null, this._placeholder)

    this._node
      .append('input')
      .attr('autocomplete', 'on')
      .attr('name', 'search')
      .attr('type', 'search')
      .attr('placeholder', placeholder)
  }

  formatSearch (value) {
    const parts = value.match(/[^"\s]+|"[^"]+"/g) || []

    let match = null
    let part = null

    for (let i = 0; i < parts.length; i += 1) {
      part = parts[i]
      match = part.match(/".+"/)

      if (match === null) {
        parts[i] = this._wildcard + part + this._wildcard
      }
    }

    if (parts.length > 0) {
      return parts.join(' ').trim()
    }

    return undefined
  }

  resolveBefore (box, data) {
    if (box.input !== undefined) {
      return this.resolveInput(box, data)
    }

    if (box.toggle !== undefined) {
      return this.resolveToggle(box, data)
    }

    return this.resolveSearch(box, data)
  }

  resolveInput (box) {
    this._storage.setItem(`search-${this._id}`, box.input)

    box.list.search = this.formatSearch(box.input)

    delete box.input
    delete box.list.append

    return this._node
  }

  resolveSearch (box, data) {
    const value = this._storage.getItem(`search-${this._id}`)

    if (value !== null) {
      this._node.classed('in', true)
      this._node.select('input').attr('value', value)

      defaults(box, {
        list: {
          search: this.formatSearch(value)
        }
      })
    }

    return this.resolveOuter(box, data)
  }

  resolveToggle (box) {
    const addIn = !this._node.classed('in')

    if (addIn === true) {
      this._node
        .select('input')
        .node()
        .focus()
    }

    this._node.classed('in', addIn)

    delete box.toggle
    return this._node
  }
}
