import mysql from 'mysql'
import { Client } from './client.js'
import map from '../map/index.js'

export class Mysql extends Client {
  setPool (value = null) {
    if (this._pool !== null) {
      this._pool.end()
    }

    if (value === null) {
      this._pool = null
      return this
    }

    this._pool = mysql.createPool(value)
    return this
  }

  connectClient (box, callback) {
    if (box.sql !== undefined && box.sql.connection !== undefined) {
      callback(null, box.sql.connection)
      return
    }

    this._pool.getConnection((error, poolConnection) => {
      if (error !== null) {
        callback(error)
        return
      }

      callback(null, poolConnection)
    })
  }

  disconnectClient (box, query, connection, callback) {
    if (query.getParent().getRelease() === false) {
      box.sql = { connection }
      callback()
      return
    }

    delete box.sql

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
      .log('info', 'Executing MySQL query %s', [string], box.rid)

    this.connectClient(box, (connectError, connection) => {
      if (connectError !== null) {
        callback(connectError)
        return
      }

      connection.query(string, (error, rows = []) => {
        this.disconnectClient(box, query, connection, () => {
          callback(error, { rows })
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
      .log('info', 'Streaming MySQL query %s', [string], box.rid)

    this.connectClient(box, (connectError, connection) => {
      if (connectError !== null) {
        callback(connectError)
        return
      }

      const stream = connection.query(string).stream()

      this.streamQueryEvents(box, query, stream, (error, result = {}) => {
        if (result.last === false) {
          callback(error, result)
          return
        }

        this.disconnectClient(box, query, connection, () => {
          if (result.row !== null) {
            callback(error, result)
          }
        })
      })
    })
  }

  streamQueryEvents (box, query, stream, callback) {
    if (query.getParent().getThrottle() === true) {
      query.getParent().prepareBoxThrottle(box, stream)
    }

    let next = null

    stream.once('end', () => {
      callback(null, { last: true, row: next })
      stream.removeAllListeners()
    })

    stream.once('error', (error) => {
      callback(error, { last: true, row: null })
      stream.removeAllListeners()
    })

    stream.on('data', (row) => {
      if (next !== null) {
        callback(null, { last: false, row: next })
      }

      next = row
    })
  }
}

Mysql.attachFactories(map)
