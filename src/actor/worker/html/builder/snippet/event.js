import * as d3 from 'd3-selection'
import debounce from 'lodash/debounce.js'
import { Action } from './action.js'

export class Event extends Action {
  constructor (options = {}) {
    super(options)

    this._name = null
    this._debounce = null

    this.setName(options.name)
    this.setDebounce(options.debounce)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      name: this._name,
      debounce: this._debounce
    }
  }

  getName () {
    return this._name
  }

  setName (value = null) {
    this._name = value
    return this
  }

  name (value) {
    return this.setName(value)
  }

  getDebounce () {
    return this._debounce
  }

  setDebounce (value = 0) {
    this._debounce = value
    return this
  }

  debounce (value) {
    return this.setDebounce(value)
  }

  bind (box, data, snippet) {
    const node = this.resolveValue(box, data, snippet)

    if (node === null) {
      return
    }

    const debounced = debounce((debounceEvent) => {
      this.handleBefore(box, data, snippet, debounceEvent)
    }, this._debounce)

    node.on(this._name, () => {
      d3.event.preventDefault()
      debounced(d3.event)
    })
  }

  handle (box, data) {
    this.pass(box, data)
  }

  handleBefore (box, data, snippet, debounceEvent) {
    this.handle(box, data, snippet, debounceEvent)
  }

  removeBefore () {
    for (let i = 0; i < this._args.length; i += 1) {
      this.unbind(this._args[i])
    }

    this.removeOuter()
  }

  resolveAfter () {
    const result = []

    for (let i = 0; i < this._args.length; i += 1) {
      result.push(this._args[i].node())
    }

    return result
  }

  resolveInner (box, data) {
    for (let i = 0; i < this._args.length; i += 1) {
      this.bind(box, data, this._args[i])
    }

    return this.resolveAfter(box, data)
  }

  unbind (snippet) {
    const node = snippet.node()

    if (node === null) {
      return
    }

    node.on(this._name, null)
  }
}
