import mysql from 'mysql'
import sqlstring from 'sqlstring'
import { Dialect } from './dialect'

const pools = {}

export class Mysql extends Dialect {
  escape (value, type) {
    if (type === 'id') {
      return `\`${value.replace(/\./g, '`.`')}\``.replace('.`*`', '.*')
    }

    if (type === 'value') {
      return sqlstring.escape(value)
    }

    return value
  }

  execute (box, data, query, callback) {
    this.open(box, data, (openError, connection, mustRelease = true) => {
      if (openError !== null) {
        callback(openError)
        return
      }

      connection.query(query, (error, result) => {
        if (mustRelease === true) {
          connection.release()
        }

        if (error !== null) {
          error.query = query
          callback(error)
          return
        }

        callback(null, this.resolveResult(result))
      })
    })
  }

  open (box, data, callback) {
    const { host } = this._options

    if (pools[host] === undefined) {
      pools[host] = mysql.createPool(
        this._options.dsn === undefined
          ? this._options
          : this._options.dsn
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

    pools[host].getConnection((error, poolConnection) => {
      if (error !== null) {
        callback(error)
        return
      }

      callback(null, poolConnection)
    })
  }

  resolveInsert (result) {
    const key = this._builder.getKey()

    if (key === null) {
      return result
    }

    return [result.insertId]
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

      const stream = connection.query(query)

      stream.once('error', (error) => {
        stream.removeAllListeners()
        connection.release()
        callback(error)
      })

      stream.on('result', (row) => {
        callback(null, row)
      })

      stream.once('end', () => {
        stream.removeAllListeners()
        connection.release()
      })
    })
  }
}
