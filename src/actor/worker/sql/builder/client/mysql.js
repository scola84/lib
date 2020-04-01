import isError from 'lodash/isError.js'
import isObject from 'lodash/isObject.js'
import mysql from 'mysql'
import { Client } from './client.js'
import map from '../map/index.js'

export class Mysql extends Client {
  setModules (value = { mysql }) {
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

    this._pool = this
      .getModule('mysql')
      .createPool(value)

    return this
  }

  connectClient (box, callback) {
    if (isObject(box['sql.connection']) === true) {
      callback(null, box['sql.connection'])
      return
    }

    this._pool.getConnection((error, poolConnection) => {
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
      .log('info', 'Executing MySQL query %o', [string], box.rid)

    this.connectClient(box, (connectError, connection) => {
      if (isError(connectError) === true) {
        callback(connectError)
        return
      }

      connection.query(string, (queryError, rows = []) => {
        this.disconnectClient(box, query, connection, () => {
          callback(queryError, { rows })
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
      .log('info', 'Streaming MySQL query %o', [string], box.rid)

    this.connectClient(box, (connectError, connection) => {
      if (isError(connectError) === true) {
        callback(connectError)
        return
      }

      const stream = connection.query(string).stream()

      this.streamQueryEvents(stream, (streamError, result = {}) => {
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

  streamQueryEvents (stream, callback) {
    let first = true
    let next = null
    let total = 0

    stream.once('end', () => {
      callback(null, { first, total, last: true, row: next }, stream)
      stream.removeAllListeners()
    })

    stream.once('error', (error) => {
      callback(error, { first, total, last: true, row: error }, stream)
      stream.removeAllListeners()
    })

    stream.on('data', (row) => {
      if (next !== null) {
        callback(null, { first, total, last: false, row: next }, stream)
        first = false
      }

      next = { ...row }
      total += 1
    })
  }
}

Mysql.attachFactories(map)
