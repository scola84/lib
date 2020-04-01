import qs from 'qs'
import url from 'url'
import { Codec } from './codec.js'

export class UrlencodedCodec extends Codec {
  setType (value = 'application/x-www-form-urlencoded') {
    return super.setType(value)
  }

  parse (data, options) {
    return qs.parse(String(data), options)
  }

  stringify (data) {
    const params = new url.URLSearchParams()
    const keys = Object.keys(data)

    for (let i = 0, key; i < keys.length; i += 1) {
      key = keys[i]
      params.append(keys[i], data[key])
    }

    return params
  }
}
