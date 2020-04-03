import { Codec } from './codec.js'

export class PlainCodec extends Codec {
  setType (value = 'text/plain') {
    return super.setType(value)
  }

  parse (buffer, options, callback) {
    callback(null, String(buffer))
  }
}
