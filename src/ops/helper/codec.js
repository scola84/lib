import isObject from 'lodash/isObject.js'
import { codec } from './codec/index.js'

export class Codec {
  static get (type = 'default') {
    return codec[type]
  }

  static set (type, object = 'application/octet-stream') {
    codec[type] = isObject(object) === true
      ? object
      : codec[object]
  }
}

if (typeof process === 'object') {
  Codec.set('default', process.env.CODEC_DEFAULT)
}

if (typeof window === 'object') {
  Codec.set('default', window.CODEC_DEFAULT)
}
