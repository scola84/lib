import { Codec } from './codec'

export class JsonCodec extends Codec {
  parse (data) {
    return JSON.parse(String(data))
  }

  stringify (data) {
    return JSON.stringify(data)
  }
}
