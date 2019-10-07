import { event, select } from 'd3-selection'
import { Router } from '../core'
import { Route } from './router/'

const routers = {}

export class HtmlRouter extends Router {
  static handle (box, data, route) {
    const parsedRoute = Route.parse(route, box.name)
    routers[parsedRoute.name].handle(parsedRoute, data)
  }

  constructor (options = {}) {
    super(options)

    this._base = null
    this._default = null
    this._history = null
    this._name = null
    this._pop = null
    this._start = null
    this._stash = null
    this._storage = null
    this._user = null

    this.setBase(options.base)
    this.setDefault(options.default)
    this.setHistory(options.history)
    this.setName(options.name)
    this.setPop(options.pop)
    this.setStart(options.start)
    this.setStash(options.stash)
    this.setStorage(options.storage)
    this.setUser(options.user)

    this.loadHistory()

    routers[this._name] = this
  }

  getOptions () {
    return {
      ...super.getOptions(),
      base: this._base,
      default: this._default,
      history: this._history,
      name: this._name,
      pop: this._pop,
      start: this._start,
      stash: this._stash,
      storage: this._storage,
      user: this._user
    }
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

  getStart () {
    return this._start
  }

  setStart (value = null) {
    this._start = value
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
    this._storage = value === null && typeof window !== 'undefined'
      ? window.localStorage
      : value

    return this
  }

  getUser () {
    return this._user
  }

  setUser (value = null) {
    this._user = value
    return this
  }

  act (box, data) {
    box.options = box.options || {}

    if (this._pop === true && box.options.clr === true) {
      this.popClose(box)
      return
    }

    this.process(box, data)
  }

  formatHash (routes) {
    const names = Object.keys(routes)
    let hash = '#'

    for (let i = 0; i < names.length; i += 1) {
      hash += `/${routes[names[i]].format()}`
    }

    window.history.replaceState({}, '', hash)
  }

  loadHistory () {
    this._history = JSON.parse(
      this._storage.getItem(`route-${this._name}`) || '[]'
    ).map((route) => Route.parse(route))
  }

  parseHash () {
    const hash = window.location.hash.slice(2)
    const parts = hash === '' ? [] : hash.split('/')

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

    const duration = parseFloat(parent.style('transition-duration'))

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
        if (box.options.lck === false) {
          box.path = null
          box.options.clr = true
          this.act(box)
        }
      })

    base.classed('move', box.options.imm === false)
    base.style('width')

    base
      .classed('in', true)
      .on('click.scola-pop', () => {
        event.stopPropagation()
      })
  }

  process (box, data) {
    const routes = this.parseHash()
    let newBox = box

    newBox = this.processHistory(newBox, routes)
    newBox = this.processBackward(newBox, routes)
    newBox = this.processDelete(newBox, routes)

    if (newBox.path !== null) {
      newBox = this.processRoute(newBox, routes, newBox)
    } else if (routes[this._name] !== undefined) {
      newBox = this.processRoute(newBox, routes, routes[this._name])
    }

    if (this._downstreams[newBox.path] === undefined) {
      newBox = this.processDefault(newBox, routes)
    }

    this.formatHash(routes)
    this.processForward(newBox)

    if (this._downstreams[newBox.path] !== undefined) {
      if (this._pop === true) {
        this.popOpen(newBox)
      }

      this._downstreams[newBox.path].handleAct(newBox, data)
    }
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

    if (current.options.mem === true || previous.options.mem === true) {
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

    if (box.path !== null) {
      return box
    }

    if (this._base.snippet !== undefined) {
      this._base.snippet.remove()
      this._base.snippet = null
    }

    return box
  }

  processForward (box) {
    if (box.path !== null) {
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

  route (box, data, route) {
    const parsedRoute = Route.parse(route, box.name)
    this.handle(parsedRoute, data)
  }

  saveHistory () {
    this._storage.setItem(
      `route-${this._name}`,
      JSON.stringify(this._history)
    )
  }

  start () {
    if (this._start) {
      this._start()
      return
    }

    this.route({}, {}, `@${this._name}:his`)
  }

  stash () {
    const routes = this.parseHash()

    if (routes[this._name] !== undefined) {
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
