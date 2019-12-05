import { Codec } from './codec'

export class PlainCodec extends Codec {
  parse (data) {
    return String(data)
  }
}
