import groupBy from 'lodash-es/groupBy'
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
    this._host = null
    this._key = null
    this._query = null
    this._stream = null
    this._type = null

    this.setConnection(options.connection)
    this.setDialect(options.dialect)
    this.setHost(options.host)
    this.setKey(options.key)
    this.setQuery(options.query)
    this.setStream(options.stream)
    this.setType(options.type)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      connection: this._connection,
      dialect: this._dialect,
      host: this._host,
      key: this._key,
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

  getHost () {
    return this._host
  }

  setHost (value = 'default') {
    this._host = value
    return this
  }

  getKey () {
    return this._key
  }

  setKey (value = null) {
    this._key = value
    return this
  }

  getQuery () {
    return this._query
  }

  setQuery (value = null) {
    this._query = typeof value === 'function' ? value(this) : value
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
      this.createQuery(box, data)
    }

    const query = this._query.resolve(box, this.filter(box, data))

    this.log('info', box, data, query)

    if (this._stream === true) {
      this._dialect.stream(box, data, query, (error, result, cb) => {
        this.process(box, data, query, error, result, cb)
      })
    } else {
      this._dialect.execute(box, data, query, (error, row) => {
        this.process(box, data, query, error, row)
      })
    }
  }

  build () {
    return this._query
  }

  createDialect (box, data) {
    let host = this._host

    if (typeof host === 'function') {
      host = host(box, data)
    }

    let options = this._config.sql[host] || host

    if (typeof options === 'function') {
      options = options(box, data)
    }

    if (this[options.dialect] === undefined) {
      throw new Error('Dialect not defined')
    }

    this.setDialect(this[options.dialect]().options(options))
  }

  createQuery () {
    this.setQuery(this.build(this))
  }

  escape (value, type) {
    return this._dialect.escape(value, type)
  }

  merge (box, data, { query, result }) {
    if (this._merge !== null) {
      return this._merge(box, data, {
        key: this._key,
        query,
        result
      })
    }

    if (this._type === 'insert') {
      return {
        data: {
          [this._key]: result
        }
      }
    }

    if (this._type === 'link') {
      return {
        data: groupBy(result, (item) => {
          const link = item.__link
          delete item.__link
          return link
        })
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

  process (box, data, query, error, result) {
    if (error !== null) {
      this.fail(box, error)
      return
    }

    if (this._stream === false) {
      this.pass(box, this.merge(box, data, { query, result }))
      return
    }

    this.pass(box, result)
  }

  selector (...args) {
    return this._query.selector(...args)
  }
}

SqlBuilder.snippet = snippet
