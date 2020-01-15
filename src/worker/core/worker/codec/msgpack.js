import msgpack from 'msgpack-lite'
import { Codec } from './codec.js'

export class MsgpackCodec extends Codec {
  setType (value = 'application/msgpack') {
    return super.setType(value)
  }

  parse (data) {
    if (typeof msgpack === 'object') {
      return msgpack.decode(data)
    }

    return data
  }

  stringify (data) {
    if (typeof msgpack === 'object') {
      return msgpack.encode(data)
    }

    return String(data)
  }
}
