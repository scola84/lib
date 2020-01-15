import toPath from 'lodash/toPath.js'
import mysql from 'mysql'
import sqlstring from 'sqlstring'
import { Client } from './client.js'

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

  escape (value, type) {
    if (type === 'id') {
      return this.escapeId(value)
    }

    if (type === 'path') {
      return this.escapePath(value)
    }

    if (type === 'value') {
      return this.escapeValue(value)
    }

    return value
  }

  escapeId (value) {
    return `\`${value.replace(/\./g, '`.`')}\``.replace('.`*`', '.*')
  }

  escapePath (value) {
    const path = toPath(value).map((item) => {
      return item.match(/^\d+$/) === null ? `.${item}` : `[${item}]`
    })

    return `>'$${path.join('')}'`
  }

  escapeValue (value) {
    return sqlstring.escape(value)
  }

  execute (box, data, query, callback) {
    this.open(box, data, query, (openError, connection, mustRelease = true) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      const preparedQuery = this.prepareQuery(box, data, query)

      query
        .getBuilder()
        .log('info', 'Executing query %s', [preparedQuery], box.rid)

      connection.query(preparedQuery, (error, result) => {
        if (mustRelease === true) {
          connection.release()
        }

        if (error !== null) {
          error.query = preparedQuery
          callback(error)
          return
        }

        callback(null, this.resolveResult(query, result))
      })
    })
  }

  open (box, data, query, callback) {
    if (typeof box.connection === 'object') {
      callback(null, box.connection, false)
      return
    }

    const connection = query.getBuilder().getConnection()

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

  resolveInsert (query, result) {
    const key = query.getBuilder().getKey()

    if (key === null) {
      return result
    }

    return [result.insertId]
  }

  resolveResult (query, result) {
    let resolvedResult = result

    if (query.getBuilder().getType() === 'insert') {
      resolvedResult = this.resolveInsert(query, resolvedResult)
    }

    return resolvedResult
  }

  stream (box, data, query, callback) {
    this.open(box, data, query, (openError, connection) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      const preparedQuery = this.prepareQuery(box, data, query)
      const stream = connection.query(preparedQuery)
      let next = null

      query
        .getBuilder()
        .log('info', 'Streaming query %s', [preparedQuery], box.rid)

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
