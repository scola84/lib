import pg from 'pg'
import PgQueryStream from 'pg-query-stream'
import sqlstring from 'sqlstring'
import { Dialect } from './dialect'

if (typeof pg !== 'undefined') {
  pg.types.setTypeParser(1082, (value) => value)
}

const pools = {}

export class Postgresql extends Dialect {
  escape (value, type) {
    if (type === 'value') {
      return sqlstring.escape(value)
    }

    if (type === 'id') {
      return `"${value.replace(/\./g, '"."')}"`.replace('."*"', '.*')
    }

    return value
  }

  execute (box, data, query, callback) {
    this.open(box, data, (openError, connection, mustRelease = true) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      const preparedQuery = this.prepareQuery(query)

      connection.query(preparedQuery, (error, result = {}) => {
        if (mustRelease === true) {
          connection.release()
        }

        if (error !== null) {
          error.query = query
          callback(error)
          return
        }

        callback(null, this.resolveResult(result.rows))
      })
    })
  }

  open (box, data, callback) {
    const { host } = this._options

    if (pools[host] === undefined) {
      pools[host] = new pg.Pool(
        this._options.dsn === undefined
          ? this._options
          : { connectionString: this._options.dsn }
      )
    }

    const connection = this._builder.getConnection()

    if (connection !== null) {
      connection(box, data, pools[host], callback)
      return
    }

    if (box.connection !== undefined) {
      callback(null, box.connection, false)
      return
    }

    pools[host].connect((error, poolConnection) => {
      if (error !== undefined) {
        callback(error)
        return
      }

      callback(null, poolConnection)
    })
  }

  prepareInsert (query) {
    const key = this._builder.getKey()

    if (key === null) {
      return query
    }

    return `${query} RETURNING ${key}`
  }

  prepareQuery (query) {
    let preparedQuery = query

    if (this._builder.getType() === 'insert') {
      preparedQuery = this.prepareInsert(preparedQuery)
    }

    return preparedQuery
  }

  resolveInsert (result = []) {
    const key = this._builder.getKey()

    if (key === null) {
      return result
    }

    return result.map((row) => row[key])
  }

  resolveResult (result) {
    let resolvedResult = result

    if (this._builder.getType() === 'insert') {
      resolvedResult = this.resolveInsert(resolvedResult)
    }

    return resolvedResult
  }

  stream (box, data, query, callback) {
    this.open(box, data, (openError, connection) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      const stream = connection.query(new PgQueryStream(query))

      stream.once('error', (error) => {
        stream.removeAllListeners()
        connection.release()
        callback(error)
      })

      stream.on('data', (row) => {
        callback(null, row)
      })

      stream.once('end', () => {
        stream.removeAllListeners()
        connection.release()
      })
    })
  }
}
