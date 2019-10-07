import { Codec } from './codec'

export class PlainCodec extends Codec {
  static type () {
    return 'text/plain'
  }

  parse (data) {
    return String(data)
  }
}
