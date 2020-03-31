import { Codec } from './codec.js'

export class OctetStreamCodec extends Codec {
  setType (value = 'application/octet-stream') {
    return super.setType(value)
  }
}
