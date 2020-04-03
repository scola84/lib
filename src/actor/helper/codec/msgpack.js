import isObject from 'lodash/isObject.js'
import msgpack from 'msgpack-lite'
import { Codec } from './codec.js'

export class MsgpackCodec extends Codec {
  setType (value = 'application/msgpack') {
    return super.setType(value)
  }

  parse (buffer, options, callback) {
    if (isObject(msgpack) === false) {
      callback(null, buffer)
      return
    }

    try {
      callback(null, msgpack.decode(buffer, options))
    } catch (error) {
      callback(error)
    }
  }

  stringify (object, options, callback) {
    if (isObject(msgpack) === false) {
      callback(null, String(object))
      return
    }

    try {
      callback(null, msgpack.encode(object, options))
    } catch (error) {
      callback(error)
    }
  }
}
