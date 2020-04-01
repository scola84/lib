import isObject from 'lodash/isObject.js'
import msgpack from 'msgpack-lite'
import { Codec } from './codec.js'

export class MsgpackCodec extends Codec {
  setType (value = 'application/msgpack') {
    return super.setType(value)
  }

  parse (data, options) {
    if (isObject(msgpack) === true) {
      return msgpack.decode(data, options)
    }

    return data
  }

  stringify (data, options) {
    if (isObject(msgpack) === true) {
      return msgpack.encode(data, options)
    }

    return String(data)
  }
}
