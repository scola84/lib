import isArray from 'lodash/isArray.js'
import isError from 'lodash/isError.js'
import isObject from 'lodash/isObject.js'
import mysql from 'mysql'
import toolMap from '../tool/index.js'
import { Client } from './client.js'

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

  connectPool (box, callback) {
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

  disconnectPool (box, connection, persist) {
    if (persist === true) {
      box['sql.connection'] = connection
      return
    }

    delete box['sql.connection']
    connection.release()
  }

  createStream (connection, options) {
    return connection.query(options.string).stream()
  }

  normalizeResult (result) {
    return isArray(result) ? { rows: result } : result
  }
}

Mysql.attachFactories(toolMap)
