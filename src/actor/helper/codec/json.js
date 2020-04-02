import { Codec } from './codec.js'

export class JsonCodec extends Codec {
  setType (value = 'application/json') {
    return super.setType(value)
  }

  parse (buffer, { reviver }, callback) {
    try {
      callback(null, JSON.parse(String(buffer), reviver))
    } catch (error) {
      callback(error)
    }
  }

  stringify (object, { replacer, space }, callback) {
    try {
      callback(null, JSON.stringify(object, replacer, space))
    } catch (error) {
      callback(error)
    }
  }
}
