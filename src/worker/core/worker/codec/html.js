import parse5 from 'parse5'
import { Codec } from './codec.js'

export class HtmlCodec extends Codec {
  setType (value = 'text/html') {
    return super.setType(value)
  }

  parse (data) {
    if (typeof parse5 === 'object') {
      return parse5.parse(String(data))
    }

    return data
  }

  stringify (data) {
    if (typeof parse5 === 'object') {
      return parse5.serialize(data)
    }

    return String(data)
  }
}
