import { Codec } from './codec'

export class JsonCodec extends Codec {
  static type () {
    return 'application/json'
  }

  parse (data) {
    return JSON.parse(String(data))
  }

  stringify (data) {
    return JSON.stringify(data)
  }
}
