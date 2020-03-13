const snippets = new Map()

export class Snippet {
  constructor (options = {}) {
    this._args = null
    this._client = null
    this._id = null
    this._infix = null
    this._name = null
    this._origin = null
    this._parens = null
    this._parent = null
    this._permit = null
    this._postfix = null
    this._prefix = null

    this.setArgs(options.args)
    this.setClient(options.client)
    this.setId(options.id)
    this.setInfix(options.infix)
    this.setName(options.name)
    this.setOrigin(options.origin)
    this.setParens(options.parens)
    this.setParent(options.parent)
    this.setPermit(options.permit)
    this.setPostfix(options.postfix)
    this.setPrefix(options.prefix)
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
      client: this._client,
      id: this._id,
      infix: this._infix,
      name: this._name,
      origin: this._origin,
      parens: this._parens,
      parent: this._parent,
      permit: this._permit,
      postfix: this._postfix,
      prefix: this._prefix
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

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  client (value) {
    return this.setClient(value)
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

  getInfix () {
    return this._infix
  }

  setInfix (value = ', ') {
    this._infix = value
    return this
  }

  infix (value) {
    return this.setInfix(value)
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

  getParens () {
    return this._parens
  }

  setParens (value = false) {
    this._parens = value
    return this
  }

  parens () {
    return this.setParens(true)
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

  getPostfix () {
    return this._postfix
  }

  setPostfix (value = '') {
    this._postfix = value
    return this
  }

  postfix (value) {
    return this.setPostfix(value)
  }

  getPrefix () {
    return this._prefix
  }

  setPrefix (value = '') {
    this._prefix = value
    return this
  }

  prefix (value) {
    return this.setPrefix(value)
  }

  concat (left, right) {
    if ((left[left.length - 1] === ' ' && right[0] === ' ')) {
      return left + right.slice(1)
    }

    return left + right
  }

  find (compare) {
    const result = []

    if (compare(this) === true) {
      result.push(this)
    }

    let snippet = null

    for (let i = 0; i < this._args.length; i += 1) {
      snippet = this._args[i]

      if (snippet instanceof Snippet) {
        result.push(...snippet.find(compare))
      }
    }

    return result
  }

  hasPermission (box, data) {
    return this.resolveValue(box, data, this._permit)
  }

  merge (box, data, result) {
    return this.mergeInner(box, data, result)
  }

  mergeInner (box, data, result) {
    let merged = result
    let arg = null

    for (let i = 0; i < this._args.length; i += 1) {
      arg = this._args[i]

      if (arg instanceof Snippet) {
        merged = arg.merge(box, data, merged)
      }
    }

    return merged
  }

  resolve (box, data) {
    const hasPermission = this.hasPermission(box, data)

    if (hasPermission === false) {
      return undefined
    }

    let string = ''

    string = this.concat(string, this._prefix)
    string = this.concat(string, this.resolveInner(box, data))
    string = this.concat(string, this._postfix)

    return string
  }

  resolveInner (box, data) {
    let string = ''

    let count = 0
    let value = null

    for (let i = 0; i < this._args.length; i += 1) {
      value = this.resolveValue(box, data, this._args[i])

      if (value === null) {
        continue
      }

      if (count > 0) {
        string = this.concat(string, this._infix)
      }

      string = this.concat(string, value)

      count += 1
    }

    return this.resolveParens(string, this._parens)
  }

  resolveParens (value, addParens) {
    if (value !== '' && addParens === true) {
      return `(${value})`
    }

    return value
  }

  resolveValue (box, data, value) {
    if (value === undefined || value === null) {
      return 'NULL'
    }

    if (value instanceof Snippet) {
      return this.resolveValue(box, data, value.resolve(box, data))
    }

    if (typeof value === 'object') {
      return this.resolveValue(box, data, JSON.stringify(value))
    }

    if (typeof value === 'function') {
      return this.resolveValue(box, data, value(box, data))
    }

    return value
  }
}

Snippet.snippets = snippets
