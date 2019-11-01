import qs from 'qs'
import { Codec } from './codec'

export class UrlencodedCodec extends Codec {
  static type () {
    return 'application/x-www-form-urlencoded'
  }

  parse (data) {
    return qs.parse(String(data))
  }

  stringify (data) {
    return qs.stringify(data)
  }
}
