import pg from 'pg'
import PgQueryStream from 'pg-query-stream'
import { Client } from './client.js'
import map from '../map/index.js'

if (typeof pg === 'object') {
  pg.types.setTypeParser(20, (value) => parseInt(value, 10))
  pg.types.setTypeParser(1082, (value) => value)
  pg.types.setTypeParser(1114, (value) => value)
  pg.types.setTypeParser(1184, (value) => value)
}

export class Postgresql extends Client {
  setPool (value = null) {
    if (this._pool !== null) {
      this._pool.end()
    }

    if (value === null) {
      this._pool = null
      return this
    }

    this._pool = new pg.Pool({
      connectionString: value
    })

    return this
  }

  execute (box, data, query, callback) {
    this.open(box, data, (openError, connection, mustRelease = true) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      connection.query(query, (error, result = { rows: [] }) => {
        if (mustRelease === true) {
          connection.release()
        }

        if (error !== null) {
          error.query = query
          callback(error)
          return
        }

        callback(null, result.rows)
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

    this._pool.connect((error, poolConnection) => {
      if (error instanceof Error) {
        callback(error)
        return
      }

      callback(null, poolConnection)
    })
  }

  stream (box, data, query, callback) {
    this.open(box, data, (openError, connection) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      const stream = connection.query(new PgQueryStream(query))
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

      stream.on('data', (row) => {
        if (next !== null) {
          callback(null, next, false)
        }

        next = row
      })
    })
  }
}

Postgresql.attachFactories(map)
