import { Codec } from './codec.js'

export class JsonCodec extends Codec {
  setType (value = 'application/json') {
    return super.setType(value)
  }

  parse (data, reviver) {
    return JSON.parse(String(data), reviver)
  }

  stringify (data, replacer, space) {
    return JSON.stringify(data, replacer, space)
  }
}
