import isObject from 'lodash/isObject.js'
import { Builder } from '../core/index.js'
import map from './builder/map/client.js'
import snippet from './builder/snippet/index.js'

const clients = new Map()

export class SqlBuilder extends Builder {
  constructor (options = {}) {
    super(options)

    this._build = null
    this._client = null
    this._connection = null
    this._query = null
    this._release = null
    this._result = null
    this._throttle = null

    this.setBuild(options.build)
    this.setClient(options.client)
    this.setConnection(options.connection)
    this.setQuery(options.query)
    this.setRelease(options.release)
    this.setResult(options.result)
    this.setThrottle(options.throttle)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      build: this._build,
      client: this._client,
      connection: this._connection,
      query: this._query,
      release: this._release,
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

  getConnection () {
    return this._connection
  }

  setConnection (value = null) {
    this._connection = value
    return this
  }

  getQuery () {
    return this._query
  }

  setQuery (value = new Map()) {
    this._query = value
    return this
  }

  getRelease () {
    return this._release
  }

  setRelease (value = true) {
    this._release = value
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
    const client = this.resolveClient(box, data)
    const query = this.resolveQuery(box, data, client)

    client[`${this._result}Query`](box, data, query, (error, result) => {
      if ((error instanceof Error) === true) {
        this.fail(box, error)
        return
      }

      this.pass(
        this._result === 'stream' ? { ...box } : box,
        data,
        query.merge(box, data, result)
      )
    })
  }

  build (sc) {
    return sc.query('SELECT 1')
  }

  client () {
    return 'postgresql://postgres:postgres@postgres'
  }

  merge (box, data, result) {
    if (this._result === 'stream') {
      return result.row
    }

    return data
  }

  prepareBoxThrottle (box, stream) {
    if (isObject(box[`throttle.${this._name}`]) === true) {
      throw new Error(`Throttle for '${this._name}' is defined`)
    }

    box[`throttle.${this._name}`] = {
      pause: () => {
        stream.pause()
      },
      resume: () => {
        stream.resume()
      }
    }

    return box
  }

  resolveClient (box, data) {
    const dsn = this.resolve('client', box, data)

    if (clients.has(dsn) === false) {
      clients.set(
        dsn,
        this[dsn.split(':').shift()]().setPool(dsn)
      )
    }

    return clients.get(dsn)
  }

  resolveQuery (box, data, client) {
    if (this._query.has(client) === false) {
      this._query.set(
        client,
        this.resolve('build', client).setParent(this)
      )
    }

    return this._query.get(client)
  }
}

SqlBuilder.snippet = snippet
SqlBuilder.attachFactories({ map })
