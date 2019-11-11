import { Builder } from '../core'
import { map, snippet } from './builder/'

export class SqlBuilder extends Builder {
  static setup () {
    SqlBuilder.attachFactories(SqlBuilder, map)
  }

  constructor (options = {}) {
    super(options)

    this._connection = null
    this._dialect = null
    this._key = null
    this._name = null
    this._query = null
    this._stream = null
    this._type = null

    this.setConnection(options.connection)
    this.setDialect(options.dialect)
    this.setKey(options.key)
    this.setName(options.name)
    this.setQuery(options.query)
    this.setStream(options.stream)
    this.setType(options.type)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      connection: this._connection,
      dialect: this._dialect,
      key: this._key,
      name: this._name,
      query: this._query,
      stream: this._stream,
      type: this._type
    }
  }

  getConnection () {
    return this._connection
  }

  setConnection (value = null) {
    this._connection = value
    return this
  }

  getDialect () {
    return this._dialect
  }

  setDialect (value = null) {
    this._dialect = value
    return this
  }

  getKey () {
    return this._key
  }

  setKey (value = null) {
    this._key = value
    return this
  }

  getName () {
    return this._name
  }

  setName (value = 'default') {
    this._name = value
    return this
  }

  getQuery () {
    return this._query
  }

  setQuery (value = null) {
    this._query = typeof value === 'function'
      ? value.call(this, this)
      : value

    return this
  }

  getStream () {
    return this._stream
  }

  setStream (value = false) {
    this._stream = value
    return this
  }

  getType () {
    return this._type
  }

  setType (value = null) {
    this._type = value
    return this
  }

  act (box, data) {
    if (this._dialect === null) {
      this.createDialect(box, data)
    }

    if (this._query === null) {
      this.createQuery()
    }

    const query = this._query.resolve(box, data)

    if (this._stream === true) {
      this.stream(box, data, query)
      return
    }

    this.execute(box, data, query)
  }

  build () {
    return this._query
  }

  createDialect (box, data) {
    let name = this._name

    if (typeof name === 'function') {
      name = name(box, data)
    }

    let options = this.getConfig(`sql.${name}`) || name

    if (typeof options === 'function') {
      options = options(box, data)
    }

    if (this[options.dialect] === undefined) {
      throw new Error('500 Dialect not defined')
    }

    this.setDialect(this[options.dialect]().options(options))
  }

  createQuery () {
    this.setQuery(this.build(this))
  }

  escape (value, type) {
    return this._dialect.escape(value, type)
  }

  execute (box, data, query) {
    this._dialect.execute(box, data, query, (error, result) => {
      if (error !== null) {
        this.fail(box, error)
        return
      }

      this.pass(box, data, query, result)
    })
  }

  merge (box, data, query, result) {
    if (this._stream === true) {
      return result
    }

    if (this._type === 'insert') {
      return {
        data: {
          [this._key]: result
        }
      }
    }

    if (this._type === 'list') {
      return {
        data: result
      }
    }

    if (this._type === 'object') {
      return {
        data: result[0]
      }
    }

    return { data: {} }
  }

  selector (...args) {
    return this._query.selector(...args)
  }

  stream (box, data, query) {
    this._dialect.stream(box, data, query, (error, result) => {
      if (error !== null) {
        this.fail(box, error)
        return
      }

      this.pass(box, data, query, result)
    })
  }
}

SqlBuilder.snippet = snippet
