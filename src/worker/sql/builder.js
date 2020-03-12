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
    this._stream = null

    this.setBuild(options.build)
    this.setClient(options.client)
    this.setConnection(options.connection)
    this.setQuery(options.query)
    this.setStream(options.stream)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      build: this._build,
      client: this._client,
      connection: this._connection,
      query: this._query,
      stream: this._stream
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

  getStream () {
    return this._stream
  }

  setStream (value = false) {
    this._stream = value
    return this
  }

  act (box, data) {
    const client = this.resolveClient(box, data)
    const method = this._stream === true ? 'stream' : 'execute'

    const query = this.resolveQuery(box, data, client)
    const resolvedQuery = query.resolve(box, data)

    this.log('info', 'Querying database (%s) %s', [method, resolvedQuery], box.rid)

    client[method](box, data, resolvedQuery, (error, result, last) => {
      if (error !== null) {
        this.fail(box, error)
        return
      }

      this.pass(box, data, query.merge(box, data, result), last)
    })
  }

  build () {
    return this.query('SELECT 1')
  }

  client () {
    return 'postgresql://postgres:postgres@postgres'
  }

  merge (box, data, result) {
    if (this._stream === true) {
      return result
    }

    return data
  }

  resolveClient (box, data) {
    const client = this.resolve('client', box, data)

    if (clients.has(client) === false) {
      clients.set(client, this[client.split(':').shift()]().pool(client))
    }

    return clients.get(client)
  }

  resolveQuery (box, data, client) {
    if (this._query.has(client) === false) {
      this._query.set(client, this.resolve('build', client))
    }

    return this._query.get(client)
  }
}

SqlBuilder.snippet = snippet
SqlBuilder.attachFactories({ map })
