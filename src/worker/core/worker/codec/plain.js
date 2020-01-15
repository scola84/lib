import { Codec } from './codec.js'

export class PlainCodec extends Codec {
  parse (data) {
    return String(data)
  }

  type () {
    return 'text/plain'
  }
}
