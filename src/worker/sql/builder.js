import { Builder } from '../core/index.js'
import map from './builder/map/index.js'
import snippet from './builder/snippet/index.js'

const clients = new Map()

export class SqlBuilder extends Builder {
  constructor (options = {}) {
    super(options)

    this._connection = null
    this._client = null
    this._key = null
    this._query = null
    this._stream = null
    this._type = null

    this.setClient(options.client)
    this.setConnection(options.connection)
    this.setKey(options.key)
    this.setQuery(options.query)
    this.setStream(options.stream)
    this.setType(options.type)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      client: this._client,
      connection: this._connection,
      key: this._key,
      query: this._query,
      stream: this._stream,
      type: this._type
    }
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
    if (this._query === null) {
      this._query = this.build(this)
    }

    const client = this.resolveClient(box, data)
    const method = this._stream === true ? 'stream' : 'execute'

    client[method](box, data, this._query, (error, result, last) => {
      if (error !== null) {
        this.fail(box, error)
        return
      }

      this.pass(box, data, result, last)
    })
  }

  build () {
    return this._query
  }

  client () {
    return 'postgresql://postgres:postgres@postgres'
  }

  merge (box, data, result) {
    if (this._stream === true) {
      return result
    }

    if (this._type === 'insert') {
      return {
        [this._key]: result
      }
    }

    if (this._type === 'list') {
      return result
    }

    if (this._type === 'object') {
      return result[0]
    }

    return data
  }

  resolveClient (box, data) {
    const client = this.resolve('client', box, data)

    if (clients.has(client) === true) {
      return clients.get(client)
    }

    clients.set(client, this[client.split(':').shift()]().pool(client))

    return clients.get(client)
  }
}

SqlBuilder.snippet = snippet
SqlBuilder.attachFactories(map)
