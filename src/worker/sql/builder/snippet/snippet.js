import toPath from 'lodash-es/toPath'

let id = 0

export class Snippet {
  static getId () {
    return id
  }

  static setId (value) {
    id = value === undefined ? id + 1 : value
    return id
  }

  constructor (options = {}) {
    this._args = null
    this._builder = null
    this._escape = null
    this._id = null
    this._infix = null
    this._name = null
    this._parens = null
    this._permit = null
    this._postfix = null
    this._prefix = null

    this.setArgs(options.args)
    this.setBuilder(options.builder)
    this.setEscape(options.escape)
    this.setId(options.id)
    this.setInfix(options.infix)
    this.setName(options.name)
    this.setParens(options.parens)
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
      builder: this._builder,
      escape: this._escape,
      id: this._id,
      infix: this._infix,
      name: this._name,
      parens: this._parens,
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
    return this
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

  getEscape () {
    return this._escape
  }

  setEscape (value = '') {
    this._escape = value
    return this
  }

  escape (value) {
    return this.setEscape(value)
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

  resolveEscape (value, type) {
    return this._builder.escape(value, type)
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
    if (typeof value === 'string') {
      return this.resolveEscape(value, this._escape)
    }

    if (typeof value === 'function') {
      return this.resolveValue(box, data, value(box, data))
    }

    if (value instanceof Snippet) {
      return this.resolveValue(box, data, value.resolve(box, data))
    }

    if (value === null) {
      return 'NULL'
    }

    return value
  }

  selector (path, index) {
    const snippets = []
    const pathList = toPath(path)

    const hasMatch =
      pathList[0] === this._name ||
      pathList[0] === index ||
      pathList[0] === '*'

    if (hasMatch === true) {
      if (pathList.length === 1) {
        snippets.push(this)
      } else {
        snippets.push(...this.selector(pathList.slice(1)))
      }

      return snippets
    }

    let snippet = null

    for (let i = 0; i < this._args.length; i += 1) {
      snippet = this._args[i]

      if (snippet instanceof Snippet) {
        snippets.push(...snippet.selector(pathList, String(i)))
      }
    }

    return snippets
  }

  set (path, index, value) {
    const list = this.selector(path)

    for (let i = 0; i < list.length; i += 1) {
      list[i].setItem(index, value)
    }

    return list
  }
}
