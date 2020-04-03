import { Codec } from './codec.js'

export class JsonCodec extends Codec {
  setType (value = 'application/json') {
    return super.setType(value)
  }

  parse (buffer, options, callback) {
    try {
      callback(null, JSON.parse(String(buffer), options.reviver))
    } catch (error) {
      callback(error)
    }
  }

  stringify (object, options, callback) {
    try {
      callback(null, JSON.stringify(object, options.replacer))
    } catch (error) {
      callback(error)
    }
  }
}
