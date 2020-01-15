import toPath from 'lodash/toPath.js'
import pg from 'pg'
import pgString from 'pg-escape'
import PgQueryStream from 'pg-query-stream'
import { Client } from './client.js'

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
    return `"${value.replace(/\./g, '"."')}"`.replace('."*"', '.*')
  }

  escapePath (value) {
    let path = toPath(value)
    let prefix = null

    path = path.map((item, index, array) => {
      if (index === 0) {
        prefix = ''
      } else if (index === array.length - 1) {
        prefix = '->>'
      } else {
        prefix = '->'
      }

      return prefix + (item.match(/^\d+$/) ? item : `'${item}'`)
    })

    return path.join('')
  }

  escapeValue (value) {
    return pgString.dollarQuotedString(value)
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

      connection.query(preparedQuery, (error, result = {}) => {
        if (mustRelease === true) {
          connection.release()
        }

        if (error !== null) {
          error.query = preparedQuery
          callback(error)
          return
        }

        callback(null, this.resolveResult(query, result.rows))
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

    this._pool.connect((error, poolConnection) => {
      if (error instanceof Error) {
        callback(error)
        return
      }

      callback(null, poolConnection)
    })
  }

  prepareInsert (query, preparedQuery) {
    const key = query.getBuilder().getKey()

    if (key === null) {
      return preparedQuery
    }

    return `${preparedQuery} RETURNING ${key}`
  }

  prepareQuery (box, data, query) {
    let preparedQuery = query.resolve(box, data)

    if (query.getBuilder().getType() === 'insert') {
      preparedQuery = this.prepareInsert(query, preparedQuery)
    }

    return preparedQuery
  }

  resolveInsert (query, result = []) {
    const key = query.getBuilder().getKey()

    if (key === null) {
      return result
    }

    return result.map((row) => row[key])
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
      const stream = connection.query(new PgQueryStream(preparedQuery))
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

      stream.on('data', (row) => {
        if (next !== null) {
          callback(null, next, false)
        }

        next = row
      })
    })
  }
}
