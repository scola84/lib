import mysql from 'mysql'
import sqlstring from 'sqlstring'
import { Dialect } from './dialect'

const pools = {}

export class Mysql extends Dialect {
  escape (value, type) {
    if (type === 'value') {
      return sqlstring.escape(value)
    }

    if (type === 'id') {
      return sqlstring.escapeId(value)
    }

    return value
  }

  execute (box, data, query, callback) {
    this.open(box, data, (cerror, connection, release = true) => {
      if (cerror) {
        callback(cerror)
        return
      }

      connection.query(query, (error, result) => {
        if (release) {
          connection.release()
        }

        if (error) {
          callback(error)
          return
        }

        callback(
          null,
          this.resolveInsert(result)
        )
      })
    })
  }

  open (box, data, callback) {
    const host = this._options.host

    if (pools[host] === undefined) {
      pools[host] = mysql.createPool(
        this._options.dsn
          ? this._options.dsn
          : this._options
      )
    }

    const connection = this._builder.getConnection()

    if (connection) {
      connection(box, data, pools[host], callback)
      return
    }

    if (box.connection) {
      callback(null, box.connection, false)
      return
    }

    pools[host].getConnection(callback)
  }

  resolveInsert (result) {
    const type = this._builder.getType()

    if (type !== 'insert') {
      return result
    }

    const key = this._builder.getKey()

    if (key === null) {
      return result
    }

    return [result.insertId]
  }

  stream (box, data, query, callback) {
    this.open(box, data, (cerror, connection) => {
      if (cerror) {
        callback(cerror)
        return
      }

      const stream = connection.query(query)

      stream.once('error', (error) => {
        stream.removeAllListeners()
        connection.release()
        callback(error)
      })

      stream.on('result', (row) => {
        callback(null, row, (bx, resume) => {
          if (resume === false) {
            connection.pause()
          } else {
            connection.resume()
          }
        })
      })

      stream.once('end', () => {
        stream.removeAllListeners()
        connection.release()
      })
    })
  }
}
