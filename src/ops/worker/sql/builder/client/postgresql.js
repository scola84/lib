import isError from 'lodash/isError.js'
import isObject from 'lodash/isObject.js'
import pg from 'pg'
import Stream from 'pg-query-stream'
import { Client } from './client.js'
import map from '../map/index.js'

if (typeof pg === 'object') {
  pg.types.setTypeParser(20, (value) => parseInt(value, 10))
  pg.types.setTypeParser(1082, (value) => value)
  pg.types.setTypeParser(1114, (value) => value)
  pg.types.setTypeParser(1184, (value) => value)
}

export class Postgresql extends Client {
  setModules (value = { Pool: pg.Pool, Stream }) {
    return super.setModules(value)
  }

  setPool (value = null) {
    if (this._pool !== null) {
      this._pool.end()
    }

    if (value === null) {
      this._pool = null
      return this
    }

    this._pool = this.newModule('Pool', {
      connectionString: value
    })

    return this
  }

  connectClient (box, callback) {
    if (isObject(box['sql.connection']) === true) {
      callback(null, box['sql.connection'])
      return
    }

    this._pool.connect((error, poolConnection) => {
      if (isError(error) === true) {
        callback(error)
        return
      }

      callback(null, poolConnection)
    })
  }

  disconnectClient (box, query, connection, callback) {
    if (query.getParent().getRelease() === false) {
      box['sql.connection'] = connection
      callback()
      return
    }

    delete box['sql.connection']
    connection.release()
    callback()
  }

  returnQuery (box, data, query, callback) {
    let string = null

    try {
      string = query.resolve(box, data)
    } catch (resolveError) {
      callback(resolveError)
      return
    }

    query
      .getParent()
      .log('info', 'Executing PostgreSQL query %o', [string], box.rid)

    this.connectClient(box, (connectError, connection) => {
      if (isError(connectError) === true) {
        callback(connectError)
        return
      }

      connection.query(string, (queryError, result = { rows: [] }) => {
        this.disconnectClient(box, query, connection, () => {
          callback(queryError, result)
        })
      })
    })
  }

  streamQuery (box, data, query, callback) {
    let string = null

    try {
      string = query.resolve(box, data)
    } catch (resolveError) {
      callback(resolveError)
      return
    }

    query
      .getParent()
      .log('info', 'Streaming PostgreSQL query %o', [string], box.rid)

    this.connectClient(box, (connectError, connection) => {
      if (isError(connectError) === true) {
        callback(connectError)
        return
      }

      const stream = connection.query(this.newModule('Stream', string))

      this.streamQueryEvents(box, query, stream, (streamError, result = {}) => {
        if (result.last === false) {
          callback(streamError, result)
          return
        }

        this.disconnectClient(box, query, connection, () => {
          if (result.row !== null) {
            callback(streamError, result)
          }
        })
      })
    })
  }

  streamQueryEvents (box, query, stream, callback) {
    if (query.getParent().getThrottle() === true) {
      query.getParent().prepareBoxThrottle(box, stream)
    }

    let first = true
    let next = null
    let total = 0

    stream.once('end', () => {
      callback(null, { first, total, last: true, row: next })
      stream.removeAllListeners()
    })

    stream.once('error', (error) => {
      callback(error, { first, total, last: true, row: null })
      stream.removeAllListeners()
    })

    stream.on('data', (row) => {
      if (next !== null) {
        callback(null, { first, total, last: false, row: next })
        first = false
      }

      next = row
      total += 1
    })
  }
}

Postgresql.attachFactories(map)
