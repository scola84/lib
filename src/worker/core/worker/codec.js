import isObject from 'lodash/isObject.js'
import isString from 'lodash/isString.js'
import { codec } from './codec/index.js'

export class Codec {
  static get (type = 'default') {
    return codec[type]
  }

  static set (type, object) {
    codec[type] = isObject(object) === true
      ? object
      : codec[object]
  }
}

Codec.set('default', 'application/octet-stream')

if (typeof process === 'object') {
  if (isString(process.env.CODEC_DEFAULT) === true) {
    Codec.set('default', process.env.CODEC_DEFAULT)
  }
}
