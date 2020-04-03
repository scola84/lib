import isObject from 'lodash/isObject.js'
import parse5 from 'parse5'
import { Codec } from './codec.js'

export class HtmlCodec extends Codec {
  setType (value = 'text/html') {
    return super.setType(value)
  }

  parse (buffer, options, callback) {
    if (isObject(parse5) === false) {
      callback(null, buffer)
      return
    }

    try {
      callback(null, parse5.parse(String(buffer), options))
    } catch (error) {
      callback(error)
    }
  }

  stringify (object, options, callback) {
    if (isObject(parse5) === false) {
      callback(null, String(object))
      return
    }

    try {
      callback(null, parse5.serialize(object, options))
    } catch (error) {
      callback(error)
    }
  }
}
