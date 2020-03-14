import isObject from 'lodash/isObject.js'
import parse5 from 'parse5'
import { Codec } from './codec.js'

export class HtmlCodec extends Codec {
  setType (value = 'text/html') {
    return super.setType(value)
  }

  parse (data) {
    if (isObject(parse5) === true) {
      return parse5.parse(String(data))
    }

    return data
  }

  stringify (data) {
    if (isObject(parse5) === true) {
      return parse5.serialize(data)
    }

    return String(data)
  }
}
