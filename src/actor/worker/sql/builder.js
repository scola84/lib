import isError from 'lodash/isError.js'
import isFunction from 'lodash/isFunction.js'
import { Builder } from '../core/index.js'
import map from './builder/map/client.js'
import snippet from './builder/snippet/index.js'

const clients = new Map()

export class SqlBuilder extends Builder {
  constructor (options = {}) {
    super(options)

    this._build = null
    this._client = null
    this._rehearse = null
    this._persist = null
    this._query = null
    this._resolve = null
    this._result = null
    this._throttle = null

    this.setBuild(options.build)
    this.setClient(options.client)
    this.setRehearse(options.rehearse)
    this.setPersist(options.persist)
    this.setQuery(options.query)
    this.setResolve(options.resolve)
    this.setResult(options.result)
    this.setThrottle(options.throttle)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      build: this._build,
      client: this._client,
      persist: this._persist,
      query: this._query,
      resolve: this._resolve,
      result: this._result,
      throttle: this._throttle
    }
  }

  getBuild () {
    return this._build
  }

  setBuild (value = null) {
    this._build = value
    return this
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
  }

  getPersist () {
    return this._persist
  }

  setPersist (value = false) {
    this._persist = value
    return this
  }

  getRehearse () {
    return this._rehearse
  }

  setRehearse (value = false) {
    this._rehearse = value
    return this
  }

  getQuery () {
    return this._query
  }

  setQuery (value = new Map()) {
    this._query = value
    return this
  }

  getResolve () {
    return this._resolve
  }

  setResolve (value = false) {
    this._resolve = value
    return this
  }

  getResult () {
    return this._result
  }

  setResult (value = 'return') {
    this._result = value
    return this
  }

  getThrottle () {
    return this._throttle
  }

  setThrottle (value = false) {
    this._throttle = value
    return this
  }

  act (box, data) {
    this.execute(box, data, (executeError, merged) => {
      if (isError(executeError) === true) {
        this.fail(box, data, executeError)
        return
      }

      if (merged === null) {
        this.callBypass(box, data)
        return
      }

      this.pass(box, data, merged)
    })
  }

  build (sc) {
    return sc.query('SELECT 1')
  }

  client () {
    return 'postgresql://postgres:postgres@postgres'
  }

  err (box, data, error) {
    this.execute(box, data, (executeError) => {
      if (isError(executeError) === true) {
        this.fail(box, data, executeError)
        return
      }

      this.fail(box, data, error)
    })
  }

  execute (box, data, callback) {
    const client = this.resolveClient(box, data)
    const query = this.resolveQuery(box, data, client)

    const options = {
      name: this._name,
      persist: this._persist,
      resolve: this._resolve,
      result: this._result,
      string: query.resolve(box, data),
      throttle: this._throttle
    }

    this.log('info', 'Executing query %o', [options], box.rid)

    if (this._rehearse === true) {
      callback(null, {})
      return
    }

    client.executeQuery(box, data, options, (error, result) => {
      if (isError(error) === true) {
        callback(error)
        return
      }

      if (this._result === 'stream' && result.total === 0) {
        callback(null, null)
        return
      }

      callback(null, query.merge(box, data, result))
    })
  }

  resolveClient (box, data) {
    const client = this.resolve('client', box, data)

    if (clients.has(client) === false) {
      const type = client.split(':').shift()

      if (isFunction(this[type]) === true) {
        clients.set(client, this[type]().setPool(client))
      } else {
        throw new Error(`Could not resolve client for "${client}"`)
      }
    }

    return clients.get(client)
  }

  resolveQuery (box, data, client) {
    if (this._query.has(client) === false) {
      const query = this.resolve('build', client)
      this._query.set(client, query.setParent(this))
    }

    return this._query.get(client)
  }
}

SqlBuilder.snippet = snippet
SqlBuilder.attachFactories({ map })
