import parse5 from 'parse5'
import { Codec } from './codec'

export class HtmlCodec extends Codec {
  parse (data) {
    if (typeof parse5 === 'undefined') {
      return data
    }

    return parse5.parse(String(data))
  }

  stringify (data) {
    return parse5.serialize(data)
  }
}
