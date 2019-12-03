import { Codec } from './codec'

export class OctetStreamCodec extends Codec {
  static type () {
    return 'application/octet-stream'
  }
}
