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

  execute (box, data, query, callback) {
    this.open(box, data, (openError, connection, mustRelease = true) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      connection.query(query, (error, result = []) => {
        if (mustRelease === true) {
          connection.release()
        }

        if (error !== null) {
          error.query = query
          callback(error)
          return
        }

        callback(null, result)
      })
    })
  }

  open (box, data, callback) {
    if (typeof box.connection === 'object') {
      callback(null, box.connection, false)
      return
    }

    const connection = this._origin.getConnection()

    if (connection !== null) {
      connection(box, data, this._pool, callback)
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

  prepareQuery (box, data, query) {
    return query.resolve(box, data)
  }

  stream (box, data, query, callback) {
    this.open(box, data, (openError, connection) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      const stream = connection.query(query)
      let next = null

      stream.once('end', () => {
        if (next !== null) {
          callback(null, next, true)
        }

        next = null
        stream.removeAllListeners()
        connection.release()
      })

      stream.once('error', (error) => {
        next = null
        callback(error)
        stream.removeAllListeners()
        connection.release()
      })

      stream.on('result', (row) => {
        if (next !== null) {
          callback(null, next, false)
        }

        next = row
      })
    })
  }
}

Mysql.attachFactories(map)
