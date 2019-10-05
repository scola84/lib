import { Builder } from '../../../core'
let id = 0

export class Snippet {
  static attachFactories (target, objects) {
    Builder.attachFactories(target, objects)
  }

  constructor (options = {}) {
    this._allow = null
    this._args = null
    this._builder = null
    this._filter = null
    this._id = null
    this._parent = null
    this._storage = null

    this.setAllow(options.allow)
    this.setArgs(options.args)
    this.setBuilder(options.builder)
    this.setFilter(options.filter)
    this.setId(options.id)
    this.setParent(options.parent)
    this.setStorage(options.storage)
  }

  clone () {
    const options = this.getOptions()

    options.args = options.args.map((snippet) => {
      return snippet instanceof Snippet
        ? snippet.clone() : snippet
    })

    return new this.constructor(options)
  }

  getOptions () {
    return {
      allow: this._allow,
      args: this._args,
      builder: this._builder,
      filter: this._filter,
      id: this._id,
      parent: this._parent,
      storage: this._storage
    }
  }

  getAllow () {
    return this._allow
  }

  setAllow (value = null) {
    this._allow = value
    return this
  }

  allow (value) {
    return this.setAllow(value)
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
    return this.setArgs(
      this._args.concat(args)
    )
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

  setId (value = ++id) {
    this._id = value
    return this
  }

  id (value) {
    return this.setId(value)
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

  storage (value) {
    return this.setStorage(value)
  }

  find (compare) {
    const result = []

    if (compare(this) === true) {
      result[result.length] = this
    }

    return this.findRecursive(result, this._args, compare)
  }

  findRecursive (result, args, compare) {
    let snippet = null

    for (let i = 0; i < args.length; i += 1) {
      snippet = args[i]

      if (snippet instanceof Snippet) {
        result = result.concat(snippet.find(compare))
      }
    }

    return result
  }

  isAllowed (box, data) {
    return this.resolveValue(box, data, this._allow)
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
    const isAllowed = this.isAllowed(box, data)

    if (isAllowed === false) {
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

    if (typeof value === 'function') {
      return this.resolveValue(box, data, value(box, data))
    }

    if (value instanceof Snippet) {
      return this.resolveValue(box, data, value.resolve(box, data))
    }

    return value
  }

  resolveObject (box, data, object, name) {
    object = this.resolveValue(box, data, object)
    return this.resolveValue(box, data, object[name])
  }
}
