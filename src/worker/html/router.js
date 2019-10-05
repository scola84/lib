import { event, select } from 'd3-selection'
import { Router } from '../core'
import { Route } from './router/'

const routers = {}

export class HtmlRouter extends Router {
  static handle (box, data, route) {
    route = Route.parse(route, box.name)
    routers[route.name].handle(route, data)
  }

  constructor (options = {}) {
    super(options)

    this._base = null
    this._default = null
    this._history = null
    this._name = null
    this._pop = null
    this._stash = null
    this._storage = null

    this.setBase(options.base)
    this.setDefault(options.default)
    this.setHistory(options.history)
    this.setName(options.name)
    this.setPop(options.pop)
    this.setStash(options.stash)
    this.setStorage(options.storage)

    this.loadHistory()

    routers[this._name] = this
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      base: this._base,
      default: this._default,
      history: this._history,
      name: this._name,
      pop: this._pop,
      stash: this._stash,
      storage: this._storage
    })
  }

  getBase () {
    return this._base
  }

  setBase (value = null) {
    this._base = value
    return this
  }

  getDefault () {
    return this._default
  }

  setDefault (value = null) {
    this._default = value
    return this
  }

  getHistory () {
    return this._history
  }

  setHistory (value = []) {
    this._history = value
    return this
  }

  getName () {
    return this._name
  }

  setName (value = null) {
    this._name = value
    return this
  }

  getPop () {
    return this._pop
  }

  setPop (value = false) {
    this._pop = value
    return this
  }

  getStash () {
    return this._stash
  }

  setStash (value = null) {
    this._stash = value
    return this
  }

  getStorage () {
    return this._storage
  }

  setStorage (value = null) {
    if (value === null) {
      if (typeof window !== 'undefined') {
        value = window.localStorage
      }
    }

    this._storage = value
    return this
  }

  act (box, data) {
    if (this._pop && box.options.clr) {
      this.popClose(box)
      return
    }

    this.process(box, data)
  }

  formatHash (routes) {
    const names = Object.keys(routes)
    let hash = '#'

    for (let i = 0; i < names.length; i += 1) {
      hash += '/' + routes[names[i]].format()
    }

    window.history.replaceState({}, '', hash)
  }

  loadHistory () {
    this._history = JSON.parse(
      this._storage.getItem('route-' + this._name) || '[]'
    ).map((route) => Route.parse(route))
  }

  parseHash () {
    const hash = window.location.hash.slice(2)
    const parts = hash ? hash.split('/') : []

    const routes = {}
    let route = null

    for (let i = 0; i < parts.length; i += 1) {
      route = Route.parse(parts[i])
      routes[route.name] = route
    }

    return routes
  }

  popClose (box) {
    const base = select(this._base)
    const parent = select(this._base.parentNode)

    select(document).on('keydown.scola-pop', null)

    parent.style('width')

    parent
      .classed('in', false)
      .on('click.scola-pop', null)
      .on('transitionend.scola-pop', () => {
        parent
          .classed('open', false)
          .on('.scola-pop', null)

        this.process(box)
      })

    base.style('width')

    base
      .classed('in', false)
      .on('click.scola-pop', null)

    const duration = parseFloat(
      parent.style('transition-duration')
    )

    if (duration === 0) {
      parent.dispatch('transitionend')
    }
  }

  popOpen (box) {
    const base = select(this._base)
    const parent = select(this._base.parentNode)

    select(document).on('keydown.scola-pop', () => {
      if (event.keyCode === 27) {
        parent.dispatch('click')
      }
    })

    parent.classed('open', true)
    parent.style('width')

    parent
      .classed('in', true)
      .on('click.scola-pop', () => {
        if (box.lock !== true) {
          box.path = null
          box.options.clr = true
          this.act(box)
        }
      })

    base.classed('move', box.move !== false)
    base.style('width')

    base
      .classed('in', true)
      .on('click.scola-pop', () => {
        event.stopPropagation()
      })
  }

  process (box, data) {
    const routes = this.parseHash()

    box = this.processHistory(box, routes)
    box = this.processBackward(box, routes)
    box = this.processDelete(box, routes)

    if (box.path) {
      box = this.processRoute(box, routes, box)
    } else if (routes[this._name] !== undefined) {
      box = this.processRoute(box, routes, routes[this._name])
    }

    if (this._downstreams[box.path] === undefined) {
      box = this.processDefault(box, routes)
    }

    this.formatHash(routes)
    this.processForward(box)

    if (this._pop && this._downstreams[box.path] !== undefined) {
      this.popOpen(box)
    }

    this.pass(box.path, box, data)
  }

  processBackward (box) {
    if (box.options.bwd === false) {
      return box
    }

    if (this._history.length < 2) {
      this._history.pop()
      return box
    }

    const current = this._history.pop()
    const previous = this._history.pop()

    if (current.options.mem || previous.options.mem) {
      box.options.mem = previous.options.mem
      box.params = previous.params
      box.path = previous.path
    }

    return box
  }

  processDefault (box, routes) {
    const path = box.default || this._default

    if (path === null) {
      return box
    }

    return this.processRoute(box, routes, { path })
  }

  processDelete (box, routes) {
    if (box.options.clr === false) {
      return box
    }

    delete routes[this._name]

    this._history = []

    if (box.path) {
      return box
    }

    if (this._base.snippet) {
      this._base.snippet.remove()
      this._base.snippet = null
    }

    return box
  }

  processForward (box) {
    if (box.path) {
      this._history.push(box)
    }

    this.saveHistory()
  }

  processHistory (box) {
    if (box.options.his === false) {
      return box
    }

    if (this._history.length === 0) {
      return box
    }

    return this._history.pop()
  }

  processRoute (box, routes, from) {
    routes[this._name] = new Route({
      base: this._base,
      name: this._name,
      options: from.options,
      params: from.params,
      path: from.path
    })

    return routes[this._name]
  }

  saveHistory () {
    this._storage.setItem(
      'route-' + this._name,
      JSON.stringify(this._history)
    )
  }

  stash () {
    const routes = this.parseHash()

    if (routes[this._name]) {
      this._stash = routes[this._name]
    }

    return this
  }

  unstash () {
    const box = this._stash
    this._stash = null
    return box
  }
}
