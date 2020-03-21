import * as d3 from 'd3-selection'
import { Router, Worker } from '../core/index.js'
import { Menu, Popup, Route } from './router/index.js'
import { HtmlSnippet } from './builder/snippet/snippet.js'

const routers = new Map()

export class HtmlRouter extends Router {
  static call (route, data) {
    routers.get(route.name).call(route, data)
  }

  static parseHash () {
    const hash = window.location.hash.slice(2)

    const parts = hash === ''
      ? []
      : hash.split('/')

    const routes = {}
    let route = null

    for (let i = 0; i < parts.length; i += 1) {
      route = Route.parse(parts[i])
      routes[route.name] = route
    }

    return routes
  }

  static parseRoute (route, router) {
    return Route.parse(route, router)
  }

  constructor (options = {}) {
    super(options)

    this._base = null
    this._default = null
    this._history = null
    this._menu = null
    this._popup = null
    this._starter = null
    this._stash = null
    this._user = null

    this.setBase(options.base)
    this.setDefault(options.default)
    this.setHistory(options.history)
    this.setMenu(options.menu)
    this.setPopup(options.popup)
    this.setStarter(options.starter)
    this.setStash(options.stash)
    this.setUser(options.user)

    this.loadHistory()
  }

  getOptions () {
    return {
      ...super.getOptions(),
      base: this._base,
      default: this._default,
      history: this._history,
      menu: this._menu,
      popup: this._popup,
      starter: this._starter,
      stash: this._stash,
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

  setCache (value = 'local') {
    super.setCache(value)
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

  getMenu () {
    return this._popup
  }

  setMenu (value = null) {
    this._menu = new Menu({
      main: value,
      router: this
    })

    return this
  }

  setHistory (value = []) {
    this._history = value
    return this
  }

  setName (value = 'default') {
    routers.set(value, this)
    return super.setName(value)
  }

  getPopup () {
    return this._popup
  }

  setPopup (value = null) {
    this._popup = new Popup({
      pop: value,
      router: this
    })

    return this
  }

  getStarter () {
    return this._starter
  }

  setStarter (value = null) {
    this._starter = value
    return this
  }

  getStash () {
    return this._stash
  }

  setStash (value = null) {
    this._stash = value
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
    if (this._popup !== null) {
      if (box.options.clr === true) {
        this._popup.close(box, data)
        return
      }
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
    this._history = JSON
      .parse(this._cache.get(`route-${this._name}`) || '[]')
      .map((route) => Route.parse(route))
  }

  previous () {
    if (this._history.length === 0) {
      return null
    }

    return this._history.pop()
  }

  process (actBox, data) {
    const routes = HtmlRouter.parseHash()
    let box = actBox

    box = this.processHistory(box, routes)
    box = this.processBackward(box, routes)
    box = this.processClear(box, routes)

    if (box.path !== null) {
      box = this.processRoute(box, routes, box)
    } else if ((routes[this._name] instanceof Route) === true) {
      box = this.processRoute(box, routes, routes[this._name])
    }

    if ((this._downstreams[box.path] instanceof Worker) === false) {
      box = this.processDefault(box, routes)
    }

    this.formatHash(routes)
    this.processForward(box)

    if ((this._downstreams[box.path] instanceof Worker) === true) {
      if (this._popup !== null) {
        this._popup.open(box, data)
      }

      this._downstreams[box.path].callAct(box, data)
      d3.select(this._base).dispatch('route')
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

    const mustMemorize =
      current.options.mem === true ||
      previous.options.mem === true

    if (mustMemorize === true) {
      box.options.mem = previous.options.mem
      box.params = previous.params
      box.path = previous.path
    }

    return box
  }

  processClear (box, routes) {
    if (box.options.clr === false) {
      return box
    }

    delete routes[this._name]

    this._history = []

    if (box.path !== null) {
      return box
    }

    if ((this._base.snippet instanceof HtmlSnippet) === true) {
      this._base.snippet.remove()
      delete this._base.snippet
    }

    return box
  }

  processDefault (box, routes) {
    if (box.options.def === false) {
      return box
    }

    const path = box.default || this._default

    if (path === null) {
      return box
    }

    return this.processRoute(box, routes, { path })
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
      path: from.path,
      user: this._user
    })

    return routes[this._name]
  }

  route (route, data) {
    this.call(Route.parse(route, this._name), data)
  }

  saveHistory () {
    this._cache.set(`route-${this._name}`, JSON.stringify(this._history))
  }

  start (...args) {
    if (this._starter === false) {
      return
    }

    if (this._starter !== null) {
      this._starter.start(...args)
      return
    }

    this.route(`@${this._name}:def&his`, {})
  }

  stash () {
    const routes = HtmlRouter.parseHash()

    if ((routes[this._name] instanceof Route) === true) {
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
