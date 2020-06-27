import isError from 'lodash/isError.js'
import isObject from 'lodash/isObject.js'
import parser from 'pg-connection-string'
import pg from 'pg'
import Stream from 'pg-query-stream'
import toolMap from '../tool/index.js'
import { Client } from './client.js'

if (typeof pg === 'object') {
  pg.types.setTypeParser(20, (value) => parseInt(value, 10))
  pg.types.setTypeParser(114, (value) => value)
  pg.types.setTypeParser(1082, (value) => value)
  pg.types.setTypeParser(1114, (value) => value)
  pg.types.setTypeParser(1184, (value) => value)
}

export class Postgresql extends Client {
  setModules (value = { Pool: pg.Pool, Stream, parser }) {
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

    const config = this
      .getModule('parser')
      .parse(value)

    this._pool = this.newModule('Pool', config)
    return this
  }

  connectPool (box, callback) {
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

  disconnectPool (box, connection, persist) {
    if (persist === true) {
      box['sql.connection'] = connection
      return
    }

    delete box['sql.connection']
    connection.release()
  }

  createStream (connection, options) {
    return connection.query(this.newModule('Stream', options.string))
  }

  normalizeResult (result = { rows: [] }) {
    return result
  }
}

Postgresql.attachFactories(toolMap)
