import { Builder } from '../../../core'

let id = 0

export class Snippet {
  static getId () {
    return id
  }

  static setId (value) {
    id = value === undefined ? id + 1 : value
    return id
  }

  static attachFactories (target, objects) {
    Builder.attachFactories(target, objects)
  }

  constructor (options = {}) {
    this._args = null
    this._builder = null
    this._filter = null
    this._id = null
    this._name = null
    this._parent = null
    this._permit = null
    this._storage = null

    this.setArgs(options.args)
    this.setBuilder(options.builder)
    this.setFilter(options.filter)
    this.setId(options.id)
    this.setName(options.name)
    this.setParent(options.parent)
    this.setPermit(options.permit)
    this.setStorage(options.storage)
  }

  clone () {
    const options = this.getOptions()

    options.args = options.args.map((snippet) => {
      return snippet instanceof Snippet
        ? snippet.clone()
        : snippet
    })

    return new this.constructor(options)
  }

  getOptions () {
    return {
      args: this._args,
      builder: this._builder,
      filter: this._filter,
      id: this._id,
      name: this._name,
      parent: this._parent,
      permit: this._permit,
      storage: this._storage
    }
  }

  getArgs () {
    return this._args
  }

  setArgs (value = []) {
    this._args = value

    for (let i = 0; i < this._args.length; i += 1) {
      if (this._args[i] instanceof Snippet) {
        this._args[i].setParent(this)
      }
    }

    return this
  }

  append (...args) {
    return this.setArgs(this._args.concat(args))
  }

  args (value) {
    return this.setArgs(value)
  }

  getBuilder () {
    return this._builder
  }

  setBuilder (value = null) {
    this._builder = value
    return this
  }

  builder (value) {
    return this.setBuilder(value)
  }

  getFilter () {
    return this._filter
  }

  setFilter (value = null) {
    this._filter = value
    return this
  }

  filter (value) {
    return this.setFilter(value)
  }

  getId () {
    return this._id
  }

  setId (value = Snippet.setId()) {
    this._id = value
    return this
  }

  id (value) {
    return this.setId(value)
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

  node () {
    return this._parent.node()
  }

  getParent () {
    return this._parent
  }

  setParent (value = null) {
    this._parent = value
    return this
  }

  parent (value) {
    return this.setParent(value)
  }

  getPermit () {
    return this._permit
  }

  setPermit (value = null) {
    this._permit = value
    return this
  }

  permit (value) {
    return this.setPermit(value)
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

  storage (value) {
    return this.setStorage(value)
  }

  find (compare) {
    const snippets = []

    if (compare(this) === true) {
      snippets.push(this)
    }

    let snippet = null

    for (let i = 0; i < this._args.length; i += 1) {
      snippet = this._args[i]

      if (snippet instanceof Snippet) {
        snippets.push(...snippet.find(compare))
      }
    }

    return snippets
  }

  hasPermission (box, data) {
    return this.resolveValue(box, data, this._permit)
  }

  remove () {
    this.removeBefore()
  }

  removeAfter () {}

  removeBefore () {
    this.removeOuter()
  }

  removeInner () {
    for (let i = 0; i < this._args.length; i += 1) {
      this._args[i].remove()
    }

    this.removeAfter()
  }

  removeOuter () {
    this.removeInner()
  }

  resolve (box, data) {
    const hasPermission = this.hasPermission(box, data)

    if (hasPermission === false) {
      return null
    }

    return this.resolveBefore(box, data)
  }

  resolveAfter () {}

  resolveBefore (box, data) {
    return this.resolveOuter(box, data)
  }

  resolveInner (box, data) {
    for (let i = 0; i < this._args.length; i += 1) {
      this.resolveValue(box, data, this._args[i])
    }

    return this.resolveAfter(box, data)
  }

  resolveOuter (box, data) {
    return this.resolveInner(box, data)
  }

  resolveValue (box, data, value) {
    if (value === undefined || value === null) {
      return value
    }

    if (value instanceof Snippet) {
      return this.resolveValue(box, data, value.resolve(box, data))
    }

    if (Array.isArray(value) === true) {
      return value.map((v) => this.resolveValue(box, data, v))
    }

    if (typeof value === 'function') {
      return this.resolveValue(box, data, value(box, data))
    }

    return value
  }

  resolveObject (box, data, object, name) {
    const resolvedObject = this.resolveValue(box, data, object)
    return this.resolveValue(box, data, resolvedObject[name])
  }
}
