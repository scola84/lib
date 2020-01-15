import { codec } from './codec/index.js'

export class Codec {
  static get (type = 'default') {
    return codec[type]
  }

  static set (type, object) {
    codec[type] = typeof object === 'string'
      ? codec[object]
      : object
  }
}

if (typeof process === 'object') {
  if (typeof process.env.CODEC_DEFAULT === 'string') {
    Codec.set('default', process.env.CODEC_DEFAULT)
  }
}
