import qs from 'qs'
import { Codec } from './codec'

export class UrlencodedCodec extends Codec {
  parse (data) {
    return qs.parse(String(data))
  }

  stringify (data) {
    return qs.stringify(data)
  }
}
