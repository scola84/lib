import qs from 'qs'
import url from 'url'
import { Codec } from './codec.js'

export class UrlencodedCodec extends Codec {
  setType (value = 'application/x-www-form-urlencoded') {
    return super.setType(value)
  }

  parse (buffer, options, callback) {
    try {
      callback(null, qs.parse(String(buffer), options))
    } catch (error) {
      callback(error)
    }
  }

  stringify (object, options, callback) {
    const params = new url.URLSearchParams()
    const keys = Object.keys(object)

    for (let i = 0, key; i < keys.length; i += 1) {
      key = keys[i]
      params.append(keys[i], object[key])
    }

    callback(null, params)
  }
}
