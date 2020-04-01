import { Codec } from './codec.js'

export class PlainCodec extends Codec {
  setType (value = 'text/plain') {
    return super.setType(value)
  }

  parse (data) {
    return String(data)
  }
}
