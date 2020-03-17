import isArray from 'lodash/isArray.js'
import isFunction from 'lodash/isFunction.js'
import isNil from 'lodash/isNil.js'
import { Builder } from '../../../core/index.js'

const snippets = new Map()

export class Snippet {
  static attachFactories (objects) {
    Reflect.apply(Builder.attachFactories, this, [objects])
  }

  constructor (options = {}) {
    this._args = null
    this._filter = null
    this._id = null
    this._name = null
    this._origin = null
    this._parent = null
    this._permit = null

    this.setArgs(options.args)
    this.setFilter(options.filter)
    this.setId(options.id)
    this.setName(options.name)
    this.setOrigin(options.origin)
    this.setParent(options.parent)
    this.setPermit(options.permit)
  }

  clone () {
    const options = this.getOptions()

    options.args = options.args.map((snippet) => {
      return (snippet instanceof Snippet) === true
        ? snippet.clone()
        : snippet
    })

    return new this.constructor(options)
  }

  getOptions () {
    return {
      args: this._args,
      filter: this._filter,
      id: this._id,
      name: this._name,
      origin: this._origin,
      parent: this._parent,
      permit: this._permit
    }
  }

  getArg (index) {
    return this._args[index]
  }

  setArg (index, value) {
    this.args[index] = value
    return this
  }

  arg (index, value) {
    return this.setArg(index, value)
  }

  getArgs () {
    return this._args
  }

  setArgs (value = []) {
    this._args = value

    for (let i = 0; i < this._args.length; i += 1) {
      if ((this._args[i] instanceof Snippet) === true) {
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

  setId (value = snippets.size) {
    snippets.set(value, this)
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

  getOrigin () {
    return this._origin
  }

  setOrigin (value = null) {
    this._origin = value
    return this
  }

  origin (value) {
    return this.setOrigin(value)
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

  find (compare) {
    const result = []

    if (compare(this) === true) {
      result.push(this)
    }

    let snippet = null

    for (let i = 0; i < this._args.length; i += 1) {
      snippet = this._args[i]

      if ((snippet instanceof Snippet) === true) {
        result.push(...snippet.find(compare))
      }
    }

    return result
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
    if (isNil(value) === true) {
      return null
    }

    if ((value instanceof Snippet) === true) {
      return this.resolveValue(box, data, value.resolve(box, data))
    }

    if (isFunction(value) === true) {
      return this.resolveValue(box, data, value(box, data))
    }

    return value
  }
}

Snippet.snippets = snippets
