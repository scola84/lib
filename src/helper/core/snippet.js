import { Loader } from './loader.js'

const snippets = new Map()

export class Snippet extends Loader {
  constructor (options = {}) {
    super(options)

    this._args = null
    this._id = null
    this._name = null
    this._origin = null
    this._parent = null
    this._permit = null

    this.setArgs(options.args)
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
}

Snippet.snippets = snippets
