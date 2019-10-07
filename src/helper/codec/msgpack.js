import msgpack from 'msgpack-lite'
import { Codec } from './codec'

export class MsgpackCodec extends Codec {
  static type () {
    return 'application/msgpack'
  }

  parse (data) {
    if (typeof msgpack === 'undefined') {
      return data
    }

    return msgpack.decode(data)
  }

  stringify (data) {
    return msgpack.encode(data)
  }
}
