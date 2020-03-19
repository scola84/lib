import { Codec } from './codec.js'

export class JsonCodec extends Codec {
  setType (value = 'application/json') {
    return super.setType(value)
  }

  parse (data) {
    return JSON.parse(String(data))
  }

  stringify (data) {
    return JSON.stringify(data)
  }
}
